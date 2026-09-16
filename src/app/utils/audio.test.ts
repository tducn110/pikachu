import { describe, expect, it, beforeEach } from "vitest";
import { setAudioPolicy, unlockAudio, isBgmPlayable, isSfxPlayable, getAudioPolicy } from "./audio";

describe("audio policy", () => {
  beforeEach(() => {
    unlockAudio();
    setAudioPolicy({
      musicEnabled: true,
      sfxEnabled: true,
      parentMuted: false,
      paused: false,
      shouldPlayBgm: true,
    });
  });

  it("allows BGM when unlocked, musicEnabled, not paused, and shouldPlayBgm is true", () => {
    expect(isBgmPlayable()).toBe(true);
  });

  it("pauses BGM when shouldPlayBgm is false (such as on Win, Lose, or Revive screens)", () => {
    setAudioPolicy({ shouldPlayBgm: false });
    expect(isBgmPlayable()).toBe(false);
  });

  it("pauses BGM when paused is true (such as PauseOverlay or Dashboard)", () => {
    setAudioPolicy({ paused: true });
    expect(isBgmPlayable()).toBe(false);
  });

  it("pauses BGM when musicEnabled is false", () => {
    setAudioPolicy({ musicEnabled: false });
    expect(isBgmPlayable()).toBe(false);
  });

  it("pauses BGM when parentMuted is true", () => {
    setAudioPolicy({ parentMuted: true });
    expect(isBgmPlayable()).toBe(false);
  });

  it("allows UI click and toggle sounds even while game is paused", () => {
    setAudioPolicy({ paused: true });
    expect(isSfxPlayable("click")).toBe(true);
    expect(isSfxPlayable("toggle")).toBe(true);
    expect(isSfxPlayable("close")).toBe(true);
  });

  it("blocks gameplay board sounds while paused", () => {
    setAudioPolicy({ paused: true });
    expect(isSfxPlayable("tap")).toBe(false);
    expect(isSfxPlayable("match")).toBe(false);
    expect(isSfxPlayable("reset")).toBe(false);
  });

  it("allows round completion fanfare sounds when triggered", () => {
    expect(isSfxPlayable("win")).toBe(true);
    expect(isSfxPlayable("wrong")).toBe(true);
    expect(isSfxPlayable("timeout")).toBe(true);
  });

  it("handles preloadEssentialAudio and preloadNonCriticalAudio gracefully without errors", async () => {
    const { preloadEssentialAudio, preloadNonCriticalAudio } = await import("./audio");
    await expect(preloadEssentialAudio()).resolves.toBeUndefined();
    await expect(preloadNonCriticalAudio()).resolves.toBeUndefined();
  });
});
