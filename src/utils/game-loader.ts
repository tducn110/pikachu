import { preloadEssentialAudio, preloadNonCriticalAudio } from "../app/utils/audio";

// Preload strictly CRITICAL resources required for the initial game view.
// Architecture referenced from 02_2048:
// Phase 1: Fonts & typography
// Phase 2: Core gameplay SFX (tap, match, wrong)
// Non-critical: BGM and victory sounds loaded during idle time after splash dismissal

let criticalPreloadPromise: Promise<void> | null = null;

async function preloadFonts(): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) return;
  try {
    await Promise.all([
      document.fonts.load('400 16px "Be Vietnam Pro"'),
      document.fonts.load('700 16px "Be Vietnam Pro"'),
      document.fonts.load('800 16px "Be Vietnam Pro"'),
      document.fonts.load('500 16px "Plus Jakarta Sans"'),
      document.fonts.load('700 16px "Plus Jakarta Sans"'),
    ]);
    await document.fonts.ready;
  } catch {
    // Non-fatal font load fallback
  }
}

export function preloadCriticalResources(onProgress?: (pct: number) => void): Promise<void> {
  if (criticalPreloadPromise) return criticalPreloadPromise;

  criticalPreloadPromise = (async () => {
    onProgress?.(25);
    // Phase 1: Custom typography
    await preloadFonts().catch(() => {});
    onProgress?.(65);
    // Phase 2: Core gameplay SFX (tap, click, match, wrong)
    await preloadEssentialAudio().catch(() => {});
    onProgress?.(95);
  })()
    .then(() => undefined)
    .catch((error) => {
      criticalPreloadPromise = null;
      throw error;
    });

  return criticalPreloadPromise;
}

export function preloadNonCriticalResources(): void {
  if (typeof window === "undefined") return;

  const loadBackgroundAudio = () => {
    void preloadNonCriticalAudio().catch(() => {});
  };

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(loadBackgroundAudio, { timeout: 4000 });
  } else {
    setTimeout(loadBackgroundAudio, 1200);
  }
}
