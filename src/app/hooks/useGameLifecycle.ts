import { useCallback, useEffect, useState } from "react";
import { winkGame } from "../../integrations/wink/client";

export type PauseReason = "background" | "host";

const getInitialHostPaused = () => winkGame.state?.lifecycle.paused === true;
const getInitialParentMuted = () => winkGame.state?.lifecycle.muted === true;
const getInitialBackgroundPaused = () =>
  typeof document !== "undefined" && document.hidden;

/**
 * Composes browser and parent lifecycle into application state. A return from
 * the browser or host leaves the round paused until the player explicitly
 * continues, so audio is never restarted outside a trusted gesture.
 */
export function useGameLifecycle() {
  const [hostPaused, setHostPaused] = useState(getInitialHostPaused);
  const [parentMuted, setParentMuted] = useState(getInitialParentMuted);
  const [backgroundPaused, setBackgroundPaused] = useState(getInitialBackgroundPaused);
  const [pauseReason, setPauseReason] = useState<PauseReason | null>(() =>
    getInitialHostPaused() ? "host" : getInitialBackgroundPaused() ? "background" : null,
  );

  useEffect(() => {
    const stopLifecycle = winkGame.bindLifecycle({
      onPause: () => {
        setHostPaused(true);
        setPauseReason("host");
      },
      onResume: () => setHostPaused(false),
      onMute: () => setParentMuted(true),
      onUnmute: () => setParentMuted(false),
    });

    const pauseForBackground = () => {
      setBackgroundPaused(true);
      setPauseReason("background");
    };
    const handleVisibility = () => {
      if (document.hidden) pauseForBackground();
      else setBackgroundPaused(false);
    };
    const handleFocus = () => {
      if (!document.hidden) setBackgroundPaused(false);
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", pauseForBackground);
    window.addEventListener("focus", handleFocus);
    return () => {
      stopLifecycle();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", pauseForBackground);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const canContinue = !hostPaused && !backgroundPaused;
  const acknowledgePause = useCallback(() => {
    if (!canContinue) return false;
    setPauseReason(null);
    return true;
  }, [canContinue]);

  return {
    hostPaused,
    parentMuted,
    backgroundPaused,
    pauseReason,
    canContinue,
    acknowledgePause,
  };
}
