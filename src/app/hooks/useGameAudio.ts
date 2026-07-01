import { useState, useCallback, useEffect } from "react";
import { type Sfx, playBeep, toggleBgm } from "../utils/audio";

export function useGameAudio() {
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(false);

  useEffect(() => {
    toggleBgm(musicEnabled);
    return () => toggleBgm(false);
  }, [musicEnabled]);

  const sfx = useCallback(
    (type: Sfx) => {
      if (sfxEnabled) playBeep(type);
    },
    [sfxEnabled]
  );

  return { sfxEnabled, setSfxEnabled, musicEnabled, setMusicEnabled, sfx };
}
