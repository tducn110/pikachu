import { Howl, Howler } from "howler";

export type Sfx = "tap" | "match" | "wrong" | "timeout" | "win" | "reset";
export type UiSound = "click" | "close" | "toggle";

const SFX_SOURCES: Record<Sfx | UiSound, string> = {
  tap: "/audio/click.mp3",
  click: "/audio/click.mp3",
  close: "/audio/click.mp3",
  toggle: "/audio/click.mp3",
  match: "/audio/match.mp3",
  wrong: "/audio/wrong.mp3",
  // Separate event even while product uses the same fallback asset.
  timeout: "/audio/wrong.mp3",
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
  timeout: 0.46,
  win: 0.58,
  reset: 0.3,
};

const BGM_SOURCE = "/BGMM_Lofi2.mp3";
const BGM_VOLUME = 0.35;

let sfxBank: Partial<Record<Sfx | UiSound, Howl>> = {};
let bgm: Howl | null = null;
const SFX_POOL_SIZE: Record<Sfx | UiSound, number> = {
  tap: 4,
  click: 4,
  close: 2,
  toggle: 2,
  match: 3,
  wrong: 2,
  timeout: 1,
  win: 1,
  reset: 2,
};
export interface AudioPolicy {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  parentMuted: boolean;
  paused: boolean;
  shouldPlayBgm: boolean;
}

let policy: AudioPolicy = {
  musicEnabled: true,
  sfxEnabled: true,
  parentMuted: false,
  paused: false,
  shouldPlayBgm: true,
};
let unlocked = false;

const UI_SOUNDS: ReadonlySet<Sfx | UiSound> = new Set(["click", "close", "toggle"]);
const ROUND_COMPLETION_SOUNDS: ReadonlySet<Sfx | UiSound> = new Set(["win", "wrong", "timeout"]);

function getSfx(type: Sfx | UiSound): Howl {
  const existing = sfxBank[type];
  if (existing) return existing;

  const sound = new Howl({
    src: [SFX_SOURCES[type]],
    volume: SFX_VOLUME[type],
    preload: true,
    html5: false,
    pool: SFX_POOL_SIZE[type],
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
    html5: false,
  });
  return bgm;
}

function waitForHowlLoad(sound: Howl, timeoutMs = 1500): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (sound.state() === "loaded") return Promise.resolve();
  return new Promise((resolve) => {
    let resolved = false;
    const finish = () => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    };
    sound.once("load", finish);
    sound.once("loaderror", finish);
    setTimeout(finish, timeoutMs);
  });
}

/**
 * Preload core gameplay SFX during the splash/loading screen (matching 02_2048).
 * Ensures instant tap, match, and wrong sound feedback without audio latency.
 */
export async function preloadEssentialAudio(): Promise<void> {
  if (typeof window === "undefined") return;
  const essentialTypes: Array<Sfx | UiSound> = ["tap", "click", "match", "wrong"];
  const sounds = essentialTypes.map(getSfx);
  await Promise.allSettled(sounds.map((s) => waitForHowlLoad(s, 1500)));
}

/**
 * Preload heavy BGM track and secondary completion sounds during idle time
 * after splash dismissal (matching 02_2048 non-critical audio preload).
 */
export async function preloadNonCriticalAudio(): Promise<void> {
  if (typeof window === "undefined") return;
  const bgmSound = getBgm();
  const winSound = getSfx("win");
  await Promise.allSettled([waitForHowlLoad(bgmSound, 4000), waitForHowlLoad(winSound, 2000)]);
}

function resumeAudioContext(): void {
  try {
    const context = Howler.ctx;
    if (context?.state === "suspended") void context.resume();
  } catch {
    // Browsers without Web Audio keep Howler on its HTML5 fallback.
  }
}

function canPlayBgm(): boolean {
  return unlocked && policy.musicEnabled && !policy.parentMuted && !policy.paused && policy.shouldPlayBgm;
}

function canPlaySfx(type: Sfx | UiSound): boolean {
  if (!unlocked || !policy.sfxEnabled || policy.parentMuted) return false;
  // UI interaction sounds (click, close, toggle) are always allowed even while paused
  if (UI_SOUNDS.has(type)) return true;
  // Round completion fanfare sounds
  if (ROUND_COMPLETION_SOUNDS.has(type)) return true;
  // Board interactions are only allowed during active play
  return !policy.paused;
}

function syncBgm(): void {
  if (!canPlayBgm()) {
    bgm?.pause();
    return;
  }

  resumeAudioContext();
  const track = getBgm();
  if (!track.playing()) track.play();
}

/** Apply the one playback policy shared by BGM and SFX. */
export function setAudioPolicy(next: Partial<AudioPolicy>): void {
  policy = { ...policy, ...next };
  syncBgm();
}

/** Prime Howler from a trusted pointer/keyboard gesture when available. */
export function unlockAudio(): void {
  unlocked = true;
  resumeAudioContext();
  Howler.autoUnlock = true;
  syncBgm();
}

export function playSfx(type: Sfx | UiSound): void {
  if (!canPlaySfx(type)) return;
  resumeAudioContext();
  const sound = getSfx(type);
  sound.play();
}

export function getAudioPolicy(): Readonly<AudioPolicy> {
  return { ...policy };
}

export function isBgmPlayable(): boolean {
  return canPlayBgm();
}

export function isSfxPlayable(type: Sfx | UiSound): boolean {
  return canPlaySfx(type);
}
