/**
 * lightningPath.ts  –  Runtime zigzag lightning bolt for Pikachu Pair-Match
 *
 * Layers (bottom → top inside lightningContainer):
 *   glowLine   – fat, orange/amber, low alpha  →  soft corona
 *   coreLine   – thin, warm-white/yellow        →  bright core
 *   nodeDots   – small circles at waypoints
 *   travelDot  – bright energy ball that slides A → B along world path
 *
 * Zigzag points are re-rolled every FLICKER_MS so the bolt "flickers" like
 * real electricity.  The travelling dot uses a GSAP motionPath-style approach
 * implemented manually (lerp over polyline) so there is no extra plugin dep.
 *
 * Public API
 *   createLightningBolt(parent)  →  LightningBolt
 *   bolt.play(path, ox, oy, tileSize)
 *   bolt.hide()
 *   bolt.destroy()
 */

import { Container, Graphics } from "pixi.js";
import gsap from "gsap";
import type { Point } from "../../../utils/pairMatchLogic";

// ─── tunables ────────────────────────────────────────────────────────────────
const ZIGZAG_SEGS   = 3;      // sub-segments per straight segment
const ZIGZAG_AMP    = 0.04;   // very subtle jitter to keep the path clear
const FLICKER_MS    = 30;     // faster flicker for energy
const BOLT_HOLD     = 0.15;   // snappy, decisive hold
const FADE_IN       = 0.03;   // almost instant flash in
const FADE_OUT      = 0.10;   // fast fade-out

// colours
const CORONA_COLOR  = 0xff8c2f;   // warm orange (orangeCta)
const SECONDARY_CLR = 0xffb851;   // amber glow
const CORE_COLOR    = 0xfff7b0;   // bright warm white
const DOT_EDGE      = 0xff6a00;   // travelling dot edge
const DOT_CORE      = 0xffffff;   // travelling dot centre
const NODE_COLOR    = 0xffffff;   // waypoint circles

// ─── helpers ─────────────────────────────────────────────────────────────────
function rand(lo: number, hi: number): number {
  return lo + Math.random() * (hi - lo);
}

/** Grid point → world-space pixel centre. */
function toWorld(
  path: Point[],
  ox: number,
  oy: number,
  ts: number,
): Array<{ x: number; y: number }> {
  return path.map(p => ({ x: ox + (p.c + 0.5) * ts, y: oy + (p.r + 0.5) * ts }));
}

/**
 * Generate zigzag sub-points between two world-space points.
 * perpendicular jitter keeps the bolt within its corridor.
 */
function zigzagSeg(
  ax: number, ay: number,
  bx: number, by: number,
  segs: number,
  amp: number,
): Array<[number, number]> {
  const pts: Array<[number, number]> = [[ax, ay]];
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const px  = -dy / len;   // perpendicular unit
  const py  =  dx / len;

  for (let i = 1; i < segs; i++) {
    const t = i / segs;
    const j = rand(-amp, amp) * len;
    pts.push([ax + dx * t + px * j, ay + dy * t + py * j]);
  }
  pts.push([bx, by]);
  return pts;
}

/** Build all zigzag points for a multi-waypoint path. */
function buildZigzag(
  wps: Array<{ x: number; y: number }>,
  segs: number,
  amp: number,
): Array<[number, number]> {
  const all: Array<[number, number]> = [];
  for (let i = 0; i < wps.length - 1; i++) {
    const pts = zigzagSeg(wps[i].x, wps[i].y, wps[i+1].x, wps[i+1].y, segs, amp);
    if (i === 0) all.push(...pts);
    else         all.push(...pts.slice(1));
  }
  return all;
}

/** Draw a polyline into a Graphics object. */
function strokePolyline(
  g: Graphics,
  pts: Array<[number, number]>,
  color: number,
  width: number,
  alpha: number,
): void {
  g.clear();
  if (pts.length < 2) return;
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.stroke({ color, width, alpha });
}

/** Draw node circles at each waypoint. */
function drawNodes(
  g: Graphics,
  wps: Array<{ x: number; y: number }>,
  ts: number,
): void {
  g.clear();
  const r = Math.max(3, ts * 0.09);
  for (const wp of wps) g.circle(wp.x, wp.y, r);
  g.fill({ color: NODE_COLOR, alpha: 0.92 });
  g.stroke({ color: CORONA_COLOR, width: Math.max(1.5, ts * 0.055), alpha: 0.95 });
}

/**
 * Interpolate a position along a polyline by t ∈ [0,1].
 * Segments are weighted by their pixel length.
 */
function lerpPolyline(
  pts: Array<[number, number]>,
  t: number,
): { x: number; y: number } {
  if (pts.length === 0) return { x: 0, y: 0 };
  if (pts.length === 1) return { x: pts[0][0], y: pts[0][1] };

  // cumulative lengths
  const lens: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i-1][0];
    const dy = pts[i][1] - pts[i-1][1];
    lens.push(lens[i-1] + Math.sqrt(dx*dx + dy*dy));
  }
  const total = lens[lens.length - 1];
  const target = Math.max(0, Math.min(1, t)) * total;

  for (let i = 1; i < lens.length; i++) {
    if (lens[i] >= target || i === lens.length - 1) {
      const segLen = lens[i] - lens[i-1];
      const u = segLen > 0 ? (target - lens[i-1]) / segLen : 0;
      return {
        x: pts[i-1][0] + (pts[i][0] - pts[i-1][0]) * u,
        y: pts[i-1][1] + (pts[i][1] - pts[i-1][1]) * u,
      };
    }
  }
  return { x: pts[pts.length-1][0], y: pts[pts.length-1][1] };
}

// ─── public types ─────────────────────────────────────────────────────────────
export interface LightningBolt {
  play(path: Point[], originX: number, originY: number, tileSize: number): void;
  hide(): void;
  destroy(): void;
}

// ─── factory ─────────────────────────────────────────────────────────────────
export function createLightningBolt(parent: Container): LightningBolt {
  const container  = new Container();
  container.eventMode = "none";

  // layer 0 – secondary halo (wider, more transparent)
  const haloLine   = new Graphics();
  // layer 1 – main corona (orange, semi-transparent)
  const glowLine   = new Graphics();
  // layer 2 – bright core
  const coreLine   = new Graphics();
  // layer 3 – corner node dots
  const nodeDots   = new Graphics();
  // layer 4 – travelling energy dot
  const travelDot  = new Graphics();

  container.addChild(haloLine, glowLine, coreLine, nodeDots, travelDot);
  parent.addChild(container);
  container.visible = false;

  // state
  let zigPts: Array<[number, number]> = [];
  let waypoints: Array<{ x: number; y: number }> = [];
  let currentTS  = 40;
  let flickerInt: ReturnType<typeof setInterval> | null = null;
  let travelProxy = { t: 0 };
  let travelTween: gsap.core.Tween | null = null;
  let mainTL: gsap.core.Timeline | null = null;

  // ── drawing helpers ─────────────────────────────────────────────────────
  function rerollZigzag(): void {
    zigPts = buildZigzag(waypoints, ZIGZAG_SEGS, ZIGZAG_AMP);
  }

  function renderLines(): void {
    if (!container.visible || zigPts.length < 2) return;
    const w = Math.max(2, currentTS * 0.12);
    strokePolyline(haloLine,  zigPts, SECONDARY_CLR, w * 3.0, 0.15); // Slightly stronger halo
    strokePolyline(glowLine,  zigPts, CORONA_COLOR,  w * 1.8, 0.60); // Punchy, bright glow
    strokePolyline(coreLine,  zigPts, CORE_COLOR,    w * 1.2, 1.0);  // Thicker, decisive core
    drawNodes(nodeDots, waypoints, currentTS);
  }

  function renderTravelDot(t: number): void {
    if (zigPts.length < 2) return;
    const pos = lerpPolyline(zigPts, t);
    const r   = Math.max(3, currentTS * 0.11);
    travelDot.clear();
    // outer glow ring
    travelDot.circle(pos.x, pos.y, r * 2.4);
    travelDot.fill({ color: CORONA_COLOR, alpha: 0.22 });
    // mid ring
    travelDot.circle(pos.x, pos.y, r * 1.4);
    travelDot.fill({ color: DOT_EDGE, alpha: 0.70 });
    // bright core
    travelDot.circle(pos.x, pos.y, r * 0.75);
    travelDot.fill({ color: DOT_CORE, alpha: 1 });
  }

  function startFlicker(): void {
    stopFlicker();
    flickerInt = setInterval(() => {
      rerollZigzag();
      renderLines();
    }, FLICKER_MS);
  }

  function stopFlicker(): void {
    if (flickerInt !== null) { clearInterval(flickerInt); flickerInt = null; }
  }

  // ── travelling dot GSAP tween ────────────────────────────────────────────
  function startTravelDot(duration: number): void {
    if (travelTween) { travelTween.kill(); travelTween = null; }
    travelProxy.t = 0;
    travelDot.visible = true;
    renderTravelDot(0);

    travelTween = gsap.to(travelProxy, {
      t: 1,
      duration,
      ease: "power1.inOut",
      onUpdate: () => renderTravelDot(travelProxy.t),
      onComplete: () => { travelDot.clear(); travelDot.visible = false; },
    });
  }

  // ── public ───────────────────────────────────────────────────────────────
  function play(path: Point[], ox: number, oy: number, ts: number): void {
    hide();                    // clean up any previous run

    waypoints  = toWorld(path, ox, oy, ts);
    currentTS  = ts;

    if (waypoints.length < 2) return;

    rerollZigzag();
    renderLines();

    container.visible = true;
    container.alpha   = 0;

    startFlicker();

    const holdDur = BOLT_HOLD + (path.length - 2) * 0.04; // slightly longer for bent paths

    mainTL = gsap.timeline({
      onComplete: hide,
    })
      .to(container, { alpha: 1,    duration: FADE_IN,  ease: "power2.out" })
      .call(() => startTravelDot(holdDur * 0.9))
      .to(container, { alpha: 0.88, duration: holdDur,  ease: "none" })
      .to(container, { alpha: 0,    duration: FADE_OUT, ease: "power1.in" });
  }

  function hide(): void {
    stopFlicker();
    if (travelTween) { travelTween.kill(); travelTween = null; }
    if (mainTL)      { mainTL.kill();      mainTL      = null; }
    gsap.killTweensOf(container);

    container.visible = false;
    haloLine.clear();
    glowLine.clear();
    coreLine.clear();
    nodeDots.clear();
    travelDot.clear();
    zigPts    = [];
    waypoints = [];
  }

  function destroy(): void {
    hide();
    parent.removeChild(container);
    container.destroy({ children: true });
  }

  return { play, hide, destroy };
}
