import { useState, useCallback, useEffect } from "react";
import { type Sfx, type UiSound, playSfx, setAudioPolicy, unlockAudio } from "../utils/audio";

const MUSIC_STORAGE_KEY = "pikachu-audio-music-enabled";
const SFX_STORAGE_KEY = "pikachu-audio-sfx-enabled";

function readPreference(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : value === "true";
  } catch {
    return fallback;
  }
}

function persistPreference(key: string, value: boolean): void {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // Storage is optional in embedded/private browsing contexts.
  }
}

export function useGameAudio({
  parentMuted = false,
  paused = false,
  shouldPlayBgm = true,
}: {
  parentMuted?: boolean;
  paused?: boolean;
  shouldPlayBgm?: boolean;
} = {}) {
  const [sfxEnabled, setSfxEnabled] = useState(() => readPreference(SFX_STORAGE_KEY, true));
  const [musicEnabled, setMusicEnabled] = useState(() => readPreference(MUSIC_STORAGE_KEY, true));

  useEffect(() => {
    setAudioPolicy({ sfxEnabled, musicEnabled, parentMuted, paused, shouldPlayBgm });
  }, [sfxEnabled, musicEnabled, parentMuted, paused, shouldPlayBgm]);

  useEffect(() => persistPreference(SFX_STORAGE_KEY, sfxEnabled), [sfxEnabled]);
  useEffect(() => persistPreference(MUSIC_STORAGE_KEY, musicEnabled), [musicEnabled]);

  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { capture: true, passive: true });
    window.addEventListener("keydown", unlock, { capture: true, passive: true });
    return () => {
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("keydown", unlock, true);
      setAudioPolicy({ paused: true });
    };
  }, []);

  const setMusic = useCallback((value: boolean) => {
    setMusicEnabled(value);
    setAudioPolicy({ musicEnabled: value });
  }, []);

  const setSfx = useCallback((value: boolean) => {
    setSfxEnabled(value);
    setAudioPolicy({ sfxEnabled: value });
  }, []);

  const sfx = useCallback(
    (type: Sfx) => {
      if (sfxEnabled) playSfx(type);
    },
    [sfxEnabled]
  );

  const ui = useCallback(
    (type: UiSound = "click") => {
      if (sfxEnabled) playSfx(type);
    },
    [sfxEnabled],
  );

  const resumeFromUserGesture = useCallback(() => {
    unlockAudio();
    setAudioPolicy({ paused: false, shouldPlayBgm: true });
  }, []);

  return {
    sfxEnabled,
    setSfxEnabled: setSfx,
    musicEnabled,
    setMusicEnabled: setMusic,
    sfx,
    ui,
    resumeFromUserGesture,
  };
}
