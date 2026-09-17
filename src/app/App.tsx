import { useEffect } from "react";
import { Game } from "./components/game/Game";
import { preloadCriticalResources, preloadNonCriticalResources } from "../utils/game-loader";
import { completeGameLoading, onGameLoadingDismiss, setGameLoadingProgress } from "../utils/loading-controller";
import { resolveGlobalWink } from "../integrations/wink/useWinkIntegration";

export default function App() {
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
