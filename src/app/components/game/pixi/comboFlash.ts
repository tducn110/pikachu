/**
 * comboFlash.ts  –  Screen ripple + flash when a combo is scored
 *
 * Triggers on combo ≥ 2.  Two effects:
 *
 *   1.  fullscreenFlash  – a translucent orange rectangle that briefly
 *       covers the whole stage (flash of light like a camera).
 *
 *   2.  rippleRing  – an expanding circle that emanates from the midpoint
 *       of the matched pair, fades as it grows.
 *
 * Both are pure PIXI Graphics + GSAP.  No assets, no filters.
 *
 * Usage
 *   const combo = createComboFlash(stage, app.screen);
 *   combo.fire(midX, midY, comboCount);   // call after a successful match
 *   combo.resize(app.screen);             // call if canvas resizes
 *   combo.destroy();
 */

import { Container, Graphics } from "pixi.js";
import gsap from "gsap";

// ─── tunables ────────────────────────────────────────────────────────────────
const FLASH_COLOR      = 0xff8c2f;
const FLASH_MAX_ALPHA  = 0.22;   // max flash opacity (scales with combo)
const RIPPLE_COLOR     = 0xffb851;
const RIPPLE_MIN_R     = 30;     // starting radius px
const RIPPLE_GROW      = 3.5;    // end radius = start × RIPPLE_GROW
const RIPPLE_DURATION  = 0.55;   // seconds for ring to fully expand
const FLASH_DURATION   = 0.30;   // seconds for full flash cycle

// ─── public API ──────────────────────────────────────────────────────────────
export interface ComboFlash {
  fire(midX: number, midY: number, combo: number): void;
  resize(screen: { width: number; height: number }): void;
  destroy(): void;
}

// ─── factory ─────────────────────────────────────────────────────────────────
export function createComboFlash(
  parent: Container,
  screen: { width: number; height: number },
): ComboFlash {
  const container = new Container();
  container.eventMode = "none";
  parent.addChild(container);

  // ── fullscreen flash rect ─────────────────────────────────────────────
  const flash = new Graphics();
  container.addChild(flash);

  function drawFlash(w: number, h: number): void {
    flash.clear();
    flash.rect(0, 0, w, h);
    flash.fill({ color: FLASH_COLOR, alpha: 1 });
  }
  drawFlash(screen.width, screen.height);
  flash.alpha   = 0;
  flash.visible = false;

  // ── ripple ring pool (up to 4 simultaneous rings) ─────────────────────
  const RING_POOL = 4;
  const rings: { g: Graphics; inUse: boolean }[] = [];
  for (let i = 0; i < RING_POOL; i++) {
    const g = new Graphics();
    g.visible = false;
    container.addChild(g);
    rings.push({ g, inUse: false });
  }

  function acquireRing(): (typeof rings)[0] | null {
    return rings.find(r => !r.inUse) ?? null;
  }

  // ── fire ─────────────────────────────────────────────────────────────────
  function fire(midX: number, midY: number, combo: number): void {
    if (combo < 2) return;  // only trigger from combo 2+

    const intensity = Math.min(1, (combo - 1) / 6);  // 0→1 as combo 2→8

    // 1. fullscreen flash
    flash.visible = true;
    flash.alpha   = 0;
    gsap.killTweensOf(flash);
    gsap.timeline({
      onComplete: () => { flash.visible = false; flash.alpha = 0; },
    })
      .to(flash, {
        alpha: FLASH_MAX_ALPHA * (0.4 + intensity * 0.6),
        duration: FLASH_DURATION * 0.25,
        ease: "power2.out",
      })
      .to(flash, {
        alpha: 0,
        duration: FLASH_DURATION * 0.75,
        ease: "power1.in",
      });

    // 2. ripple ring(s)  – 1 ring at combo 2-4, 2 rings at combo 5+
    const ringCount = combo >= 5 ? 2 : 1;
    for (let ri = 0; ri < ringCount; ri++) {
      const ring = acquireRing();
      if (!ring) break;
      ring.inUse = true;
      const safeRing = ring;  // TS narrowing helper

      const delay = ri * 0.08;
      const r0    = RIPPLE_MIN_R + intensity * 20;
      const r1    = r0 * RIPPLE_GROW * (0.8 + intensity * 0.4);
      const lw    = Math.max(2, 6 - ri * 1.5);

      // draw at current radius
      function drawRing(radius: number, alpha: number): void {
        safeRing.g.clear();
        safeRing.g.circle(0, 0, radius);
        safeRing.g.stroke({ color: RIPPLE_COLOR, width: lw, alpha });
      }

      drawRing(r0, 0.9);
      safeRing.g.position.set(midX, midY);
      safeRing.g.alpha   = 1;
      safeRing.g.visible = true;

      const proxy = { radius: r0, alpha: 0.9 };

      gsap.killTweensOf(proxy);
      gsap.timeline({ delay, onComplete: () => {
        safeRing.inUse     = false;
        safeRing.g.visible = false;
        safeRing.g.clear();
      }})
        .to(proxy, {
          radius: r1,
          alpha:  0,
          duration: RIPPLE_DURATION,
          ease: "power1.out",
          onUpdate: () => drawRing(proxy.radius, proxy.alpha),
        });
    }
  }

  function resize(s: { width: number; height: number }): void {
    drawFlash(s.width, s.height);
  }

  function destroy(): void {
    gsap.killTweensOf(flash);
    for (const r of rings) {
      gsap.killTweensOf(r.g);
      r.g.destroy();
    }
    flash.destroy();
    parent.removeChild(container);
    container.destroy({ children: false });
  }

  return { fire, resize, destroy };
}
