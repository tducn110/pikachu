import { Container } from "pixi.js";
import gsap from "gsap";

export interface ScreenShake {
  shake(intensity?: number, duration?: number): void;
  reset(): void;
  setPaused(paused: boolean): void;
  setReducedMotion(reduced: boolean): void;
  destroy(): void;
}

/** Shake only the board scene; the fixed DOM shell and controls stay stable. */
export function createScreenShake(target: Container): ScreenShake {
  const offset = { x: 0, y: 0 };
  let baseX = target.x;
  let baseY = target.y;
  let tween: gsap.core.Tween | null = null;
  let paused = false;
  let reducedMotion = false;

  function render(): void {
    target.position.set(baseX + offset.x, baseY + offset.y);
  }

  function reset(): void {
    tween?.kill();
    tween = null;
    offset.x = 0;
    offset.y = 0;
    baseX = target.x - offset.x;
    baseY = target.y - offset.y;
    render();
  }

  function shake(intensity = 5, duration = 0.24): void {
    if (paused || reducedMotion) return;
    baseX = target.x - offset.x;
    baseY = target.y - offset.y;
    tween?.kill();
    offset.x = 0;
    offset.y = 0;
    tween = gsap.to(offset, {
      x: intensity,
      y: intensity * 0.7,
      duration: duration / 8,
      repeat: 7,
      yoyo: true,
      ease: "power1.inOut",
      onUpdate: render,
      onComplete: () => {
        tween = null;
        offset.x = 0;
        offset.y = 0;
        render();
      },
    });
  }

  return {
    shake,
    reset,
    setPaused(nextPaused) {
      paused = nextPaused;
      tween?.paused(paused);
    },
    setReducedMotion(nextReducedMotion) {
      reducedMotion = nextReducedMotion;
      if (reducedMotion) reset();
    },
    destroy() {
      tween?.kill();
      tween = null;
      offset.x = 0;
      offset.y = 0;
      target.position.set(baseX, baseY);
    },
  };
}
