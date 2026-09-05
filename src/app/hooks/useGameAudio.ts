import { useState, useCallback, useEffect } from "react";
import { type Sfx, type UiSound, playSfx, setSfxEnabled as setAudioSfxEnabled, toggleBgm, unlockAudio } from "../utils/audio";

export function useGameAudio(parentMuted = false) {
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);

  useEffect(() => {
    setAudioSfxEnabled(sfxEnabled && !parentMuted);
  }, [sfxEnabled, parentMuted]);

  useEffect(() => {
    toggleBgm(musicEnabled && !parentMuted);
  }, [musicEnabled, parentMuted]);

  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("keydown", unlock, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      toggleBgm(false);
    };
  }, []);

  const setMusic = useCallback((value: boolean) => {
    unlockAudio();
    setMusicEnabled(value);
    toggleBgm(value && !parentMuted);
  }, [parentMuted]);

  const setSfx = useCallback((value: boolean) => {
    setSfxEnabled(value);
    setAudioSfxEnabled(value && !parentMuted);
  }, [parentMuted]);

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

  return { sfxEnabled, setSfxEnabled: setSfx, musicEnabled, setMusicEnabled: setMusic, sfx, ui };
}
