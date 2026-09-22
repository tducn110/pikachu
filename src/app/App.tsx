import { useEffect } from "react";
import { Game } from "./components/game/Game";
import { preloadCriticalResources, preloadNonCriticalResources } from "../utils/game-loader";
import { completeGameLoading, onGameLoadingDismiss, setGameLoadingProgress } from "../utils/loading-controller";
import { resolveGlobalWink } from "../integrations/wink/useWinkIntegration";

export default function App() {
  useEffect(() => {
    const blockCopyAction = (event: Event) => {
      event.preventDefault();
    };

    document.addEventListener("copy", blockCopyAction, true);
    document.addEventListener("cut", blockCopyAction, true);
    document.addEventListener("selectstart", blockCopyAction, true);
    document.addEventListener("dragstart", blockCopyAction, true);
    document.addEventListener("contextmenu", blockCopyAction, true);

    return () => {
      document.removeEventListener("copy", blockCopyAction, true);
      document.removeEventListener("cut", blockCopyAction, true);
      document.removeEventListener("selectstart", blockCopyAction, true);
      document.removeEventListener("dragstart", blockCopyAction, true);
      document.removeEventListener("contextmenu", blockCopyAction, true);
    };
  }, []);

  // Unified PapaStudio loading screen lifecycle barrier
  useEffect(() => {
    setGameLoadingProgress(25);
    const criticalPromise = preloadCriticalResources((pct) => {
      setGameLoadingProgress(Math.min(95, pct));
    });
    void Promise.allSettled([criticalPromise, resolveGlobalWink()]).then(() => {
      completeGameLoading();
    });

    const unbind = onGameLoadingDismiss(() => {
      preloadNonCriticalResources();
    });
    return unbind;
  }, []);

  return (
    <div className="h-[100dvh] overflow-hidden bg-[#eef7ff] text-[#18324f]">
      <Game />
    </div>
  );
}
