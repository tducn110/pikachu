/**
 * matchSparks.ts  –  Spark-burst effect when a tile pair is matched
 *
 * Architecture
 *   A single pool of particle Graphics objects is reused across every burst.
 *   Each particle is an arc (wedge) that flies outward with GSAP then fades.
 *   No textures, no sprite sheets, no external dependencies beyond pixi + gsap.
 *
 * Usage
 *   const sparks = createMatchSparks(stage);
 *   sparks.burst(worldX, worldY, tileSize, combo);   // call per tile
 *   sparks.destroy();                                // call on unmount
 *
 * combo ≥ 1 increases particle count + speed slightly.
 */

import { Container, Graphics } from "pixi.js";
import gsap from "gsap";

// ─── tunables ────────────────────────────────────────────────────────────────
const BASE_COUNT  = 10;   // particles per tile at combo 1
const MAX_EXTRA   = 8;    // additional particles added at high combo
const BASE_SPEED  = 1.0;  // multiplier for distance
const DURATION    = 0.52; // seconds for one particle to reach full extension
const TRAIL_ALPHA = 0.85;

// colour palette: orange → yellow → white
const COLOURS = [
  0xff6a00,  // deep orange
  0xff8c2f,  // orangeCta
  0xffb851,  // amber
  0xffe066,  // yellow
  0xfff7b0,  // warm white
  0xffffff,  // white
];

// ─── helpers ─────────────────────────────────────────────────────────────────
function randBetween(lo: number, hi: number): number {
  return lo + Math.random() * (hi - lo);
}

function randomColor(): number {
  return COLOURS[Math.floor(Math.random() * COLOURS.length)];
}

// ─── pool entry ──────────────────────────────────────────────────────────────
interface Particle {
  g:     Graphics;
  inUse: boolean;
}

// ─── public API ──────────────────────────────────────────────────────────────
export interface MatchSparks {
  burst(worldX: number, worldY: number, tileSize: number, combo: number): void;
  destroy(): void;
}

// ─── factory ─────────────────────────────────────────────────────────────────
export function createMatchSparks(parent: Container): MatchSparks {
  const container = new Container();
  container.eventMode = "none";
  parent.addChild(container);

  // pre-allocate pool
  const POOL_SIZE = BASE_COUNT + MAX_EXTRA;
  const pool: Particle[] = [];
  for (let i = 0; i < POOL_SIZE * 4; i++) {
    const g = new Graphics();
    g.visible = false;
    container.addChild(g);
    pool.push({ g, inUse: false });
  }

  function acquireParticle(): Particle | null {
    return pool.find(p => !p.inUse) ?? null;
  }

  function releaseParticle(p: Particle): void {
    p.inUse  = false;
    p.g.visible = false;
    p.g.clear();
    gsap.killTweensOf(p.g);
    gsap.killTweensOf(p.g.position);
    p.g.position.set(0, 0);
    p.g.alpha   = 1;
    p.g.scale.set(1);
    p.g.rotation = 0;
  }

  function burst(wx: number, wy: number, tileSize: number, combo: number): void {
    const count   = Math.min(BASE_COUNT + Math.floor((combo - 1) * 2), BASE_COUNT + MAX_EXTRA);
    const speedMul = BASE_SPEED + (combo - 1) * 0.12;
    const dist    = tileSize * (0.55 + Math.random() * 0.35) * speedMul;
    const baseR   = Math.max(2, tileSize * 0.055);

    for (let i = 0; i < count; i++) {
      const p = acquireParticle();
      if (!p) break;
      p.inUse = true;

      const angle  = (i / count) * Math.PI * 2 + randBetween(-0.3, 0.3);
      const d      = dist * randBetween(0.55, 1.0);
      const r      = baseR * randBetween(0.7, 1.6);
      const color  = randomColor();
      const dur    = DURATION * randBetween(0.7, 1.15);
      const delay  = randBetween(0, 0.04);

      // draw: outer glow + core dot
      p.g.clear();
      p.g.circle(0, 0, r * 2.0);
      p.g.fill({ color, alpha: 0.28 });
      p.g.circle(0, 0, r);
      p.g.fill({ color, alpha: TRAIL_ALPHA });

      p.g.position.set(wx, wy);
      p.g.alpha   = 1;
      p.g.scale.set(1);
      p.g.visible = true;

      const tx = wx + Math.cos(angle) * d;
      const ty = wy + Math.sin(angle) * d;

      gsap.timeline({ delay })
        .to(p.g.position, {
          x: tx, y: ty,
          duration: dur,
          ease: "power2.out",
        })
        .to(p.g, {
          alpha: 0,
          duration: dur * 0.55,
          ease: "power1.in",
        }, dur * 0.45)
        .to(p.g.scale, {
          x: 0.3, y: 0.3,
          duration: dur * 0.45,
          ease: "power2.in",
        }, dur * 0.55)
        .call(() => releaseParticle(p));
    }
  }

  function destroy(): void {
    for (const p of pool) {
      gsap.killTweensOf(p.g);
      gsap.killTweensOf(p.g.position);
      p.g.destroy();
    }
    parent.removeChild(container);
    container.destroy({ children: false });
  }

  return { burst, destroy };
}
