import { Howl, Howler } from "howler";

export type Sfx = "tap" | "match" | "wrong" | "win" | "reset";
export type UiSound = "click" | "close" | "toggle";

const SFX_SOURCES: Record<Sfx | UiSound, string> = {
  tap: "/audio/click.mp3",
  click: "/audio/click.mp3",
  close: "/audio/click.mp3",
  toggle: "/audio/click.mp3",
  match: "/audio/match.mp3",
  wrong: "/audio/wrong.mp3",
  win: "/audio/clear.mp3",
  reset: "/audio/click.mp3",
};

const SFX_VOLUME: Record<Sfx | UiSound, number> = {
  tap: 0.32,
  click: 0.28,
  close: 0.24,
  toggle: 0.24,
  match: 0.46,
  wrong: 0.38,
  win: 0.58,
  reset: 0.3,
};

const BGM_SOURCE = "/BGMM_Lofi2.mp3";
const BGM_VOLUME = 0.18;

let sfxBank: Partial<Record<Sfx | UiSound, Howl>> = {};
let bgm: Howl | null = null;
let musicRequested = false;
let disposed = false;
let sfxEnabled = true;

function getSfx(type: Sfx | UiSound): Howl {
  const existing = sfxBank[type];
  if (existing) return existing;

  const sound = new Howl({
    src: [SFX_SOURCES[type]],
    volume: SFX_VOLUME[type],
    preload: true,
    html5: false,
  });
  sfxBank[type] = sound;
  return sound;
}

function getBgm(): Howl {
  if (bgm) return bgm;
  bgm = new Howl({
    src: [BGM_SOURCE],
    volume: BGM_VOLUME,
    loop: true,
    preload: true,
    html5: true,
  });
  return bgm;
}

function resumeAudioContext(): void {
  try {
    const context = Howler.ctx;
    if (context?.state === "suspended") void context.resume();
  } catch {
    // Browsers without Web Audio keep Howler on its HTML5 fallback.
  }
}

export function playSfx(type: Sfx | UiSound): void {
  if (disposed || !sfxEnabled) return;
  resumeAudioContext();
  const sound = getSfx(type);
  sound.stop();
  sound.play();
}

export function setSfxEnabled(enabled: boolean): void {
  sfxEnabled = enabled;
}

export function toggleBgm(play: boolean): void {
  musicRequested = play;
  if (disposed) return;

  if (!play) {
    bgm?.fade(bgm.volume(), 0, 120);
    window.setTimeout(() => {
      if (!musicRequested) bgm?.pause();
    }, 130);
    return;
  }

  resumeAudioContext();
  const track = getBgm();
  if (!track.playing()) track.play();
}

/** Prime Howler from a trusted pointer/keyboard gesture when available. */
export function unlockAudio(): void {
  if (disposed) return;
  resumeAudioContext();
  Howler.autoUnlock = true;
}

export function destroyAudio(): void {
  disposed = true;
  for (const sound of Object.values(sfxBank)) sound?.unload();
  sfxBank = {};
  bgm?.unload();
  bgm = null;
  musicRequested = false;
  sfxEnabled = true;
}
