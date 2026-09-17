import { useCallback, useEffect, useState } from "react";
import { useWinkIntegration } from "../../integrations/wink/useWinkIntegration";

export type PauseReason = "background" | "host";

const getInitialBackgroundPaused = () =>
  typeof document !== "undefined" && document.hidden;

/**
 * Composes browser and parent lifecycle into application state. A return from
 * the browser or host leaves the round paused until the player explicitly
 * continues, so audio is never restarted outside a trusted gesture.
 */
export function useGameLifecycle() {
  const wink = useWinkIntegration();
  const [backgroundPaused, setBackgroundPaused] = useState(getInitialBackgroundPaused);
  const [pauseReason, setPauseReason] = useState<PauseReason | null>(() =>
    wink.hostPaused ? "host" : getInitialBackgroundPaused() ? "background" : null,
  );

  useEffect(() => {
    if (wink.hostPaused && pauseReason !== "host") {
      setPauseReason("host");
    }
  }, [wink.hostPaused]);

  useEffect(() => {
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
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", pauseForBackground);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const canContinue = !wink.hostPaused && !backgroundPaused;
  const acknowledgePause = useCallback(() => {
    if (!canContinue) return false;
    setPauseReason(null);
    return true;
  }, [canContinue]);

  return {
    hostPaused: wink.hostPaused,
    parentMuted: wink.hostMuted,
    backgroundPaused,
    pauseReason,
    canContinue,
    acknowledgePause,
  };
}
