import { Container } from "pixi.js";
import gsap from "gsap";

export interface ScreenShake {
  shake(intensity?: number, duration?: number): void;
  reset(): void;
  destroy(): void;
}

/** Shake only the board scene; the fixed DOM shell and controls stay stable. */
export function createScreenShake(target: Container): ScreenShake {
  const offset = { x: 0, y: 0 };
  let baseX = target.x;
  let baseY = target.y;

  function render(): void {
    target.position.set(baseX + offset.x, baseY + offset.y);
  }

  function reset(): void {
    gsap.killTweensOf(offset);
    offset.x = 0;
    offset.y = 0;
    baseX = target.x - offset.x;
    baseY = target.y - offset.y;
    render();
  }

  function shake(intensity = 5, duration = 0.24): void {
    baseX = target.x - offset.x;
    baseY = target.y - offset.y;
    gsap.killTweensOf(offset);
    offset.x = 0;
    offset.y = 0;
    gsap.to(offset, {
      x: intensity,
      y: intensity * 0.7,
      duration: duration / 8,
      repeat: 7,
      yoyo: true,
      ease: "power1.inOut",
      onUpdate: render,
      onComplete: () => {
        offset.x = 0;
        offset.y = 0;
        render();
      },
    });
  }

  return {
    shake,
    reset,
    destroy() {
      gsap.killTweensOf(offset);
      offset.x = 0;
      offset.y = 0;
      target.position.set(baseX, baseY);
    },
  };
}

