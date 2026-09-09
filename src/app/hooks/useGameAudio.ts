import { useState, useCallback, useEffect } from "react";
import { type Sfx, type UiSound, playSfx, setAudioPolicy, unlockAudio } from "../utils/audio";

export function useGameAudio({
  parentMuted = false,
  paused = false,
  shouldPlayBgm = true,
}: {
  parentMuted?: boolean;
  paused?: boolean;
  shouldPlayBgm?: boolean;
} = {}) {
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);

  useEffect(() => {
    setAudioPolicy({ sfxEnabled, musicEnabled, parentMuted, paused, shouldPlayBgm });
  }, [sfxEnabled, musicEnabled, parentMuted, paused, shouldPlayBgm]);

  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("keydown", unlock, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
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
