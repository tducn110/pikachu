import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { playSfx } from "../../utils/audio";
import { requestInterstitialAd } from "../../utils/ads";
import { usePairMatchGame } from "../../hooks/usePairMatchGame";
import { useGameLifecycle } from "../../hooks/useGameLifecycle";
import { GameBoard } from "./GameBoard";
import { PauseOverlay } from "./PauseOverlay";
import { DashboardScreen } from "../screens/DashboardScreen";
import { WinOverlay } from "./WinOverlay";
import { LoseOverlay } from "./LoseOverlay";
import { WrongToast } from "./WrongToast";
import { ShuffleToast } from "./ShuffleToast";
import { ReviveOverlay } from "./ReviveOverlay";
import { AdPromptOverlay } from "./AdPromptOverlay";
import { HyperIcon, HyperTitleBar, type HyperIconName } from "./hyperUi";
import { Pause } from "lucide-react";

export function Game() {
  const { t } = useTranslation();
  const [manualPause, setManualPause] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [adPromptItem, setAdPromptItem] = useState<"hint" | "shuffle" | "bomb" | null>(null);
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const lifecycle = useGameLifecycle();

  // One pause value reaches gameplay, Pixi rendering, and audio policy.
  const showPause = manualPause || lifecycle.pauseReason !== null;
  const isPaused = showPause || showDashboard || adPromptItem !== null || lifecycle.hostPaused || lifecycle.backgroundPaused;

  const game = usePairMatchGame({
    isPaused,
    isAdPlaying,
    parentMuted: lifecycle.parentMuted,
  });

  const handleAdStart = useCallback(() => {
    setIsAdPlaying(true);
  }, []);

  const handleAdEnd = useCallback(() => {
    setIsAdPlaying(false);
  }, []);

  const handleRestart = () => {
    handleAdStart();
    void requestInterstitialAd({
      type: "start",
      name: "restart_game",
    }).finally(() => {
      handleAdEnd();
      game.resetGame();
    });
  };

  // Interstitial between levels — transition always continues regardless of ad outcome
  const handleNextLevel = () => {
    handleAdStart();
    void requestInterstitialAd({
      type: "next",
      name: "level_complete",
    }).finally(() => {
      handleAdEnd();
      game.nextLevel();
    });
  };

  const handleCloseDashboard = () => {
    setShowDashboard(false);
  };

  const handleContinue = () => {
    if (!lifecycle.acknowledgePause()) return;
    setManualPause(false);
    game.resumeAudioFromUserGesture();
  };

  const handleSupportRequest = (type: "hint" | "shuffle" | "bomb", action: () => void) => {
    if (game.supportStock[type] <= 0) {
      // ponytail: click feedback on prompt open when stock depleted
      playSfx("click");
      setAdPromptItem(type);
    } else {
      action();
    }
  };

  const doHint = () => handleSupportRequest("hint", game.hintPair);
  const doShuffle = () => handleSupportRequest("shuffle", game.shuffleBoard);
  const doBomb = () => handleSupportRequest("bomb", game.bombPair);

  return (
    <main
      className="hyper-game-root relative h-[100dvh] overflow-hidden bg-cover bg-center bg-fixed font-sans"
      style={{ backgroundImage: "url('/background.webp')" }}
    >
      <div className="hyper-game-atmosphere pointer-events-none absolute inset-0" />

      <div className="hyper-game-viewport relative z-10 mx-auto flex h-full min-h-0 w-full items-center justify-center">
        <section className="hyper-game-stage flex h-full min-h-0 w-full flex-col items-center justify-center p-2 lg:p-8">
          <div className="hyper-main-frame w-full h-auto max-h-full my-0 flex flex-1 flex-col min-h-0 lg:h-auto lg:flex lg:flex-1 lg:my-0">
            <MobileGameHeader
              timeLeft={game.timeLeft}
              maxTime={game.maxTime}
              score={game.score}
              lives={game.lives}
              onDashboard={() => setShowDashboard(true)}
              onSettings={() => setManualPause(true)}
            />

            <div className="hyper-game-layout flex min-h-0 min-w-0 flex-1 flex-col lg:grid">
              <aside className="hyper-sidebar hidden min-h-0 lg:block">
                <DesktopTimer
                  timeLeft={game.timeLeft}
                  maxTime={game.maxTime}
                  isPaused={isPaused}
                />

                <div className="hyper-sidebar-frame">
                  <div className="hyper-sidebar-content">
                    <div className="hyper-sidebar-top">
                      <div className="hyper-score-card">
                        <HyperTitleBar className="hyper-score-title">{t("score", "Điểm")}</HyperTitleBar>
                        <button
                          type="button"
                          className="hyper-score-total"
                          onClick={() => { playSfx("click"); setShowDashboard(true); }}
                          aria-label={t("open_scores", "Mở bảng điểm")}
                        >
                          {game.score.toLocaleString("vi-VN")}
                        </button>
                        {game.combo >= 2 && (
                          <div className="hyper-score-combo" aria-label={`Combo ×${game.combo}`}>
                            <span>×{game.combo}</span>
                          </div>
                        )}
                      </div>

                      <div className="hyper-hearts-panel" aria-label={`${game.lives} ${t("lives_out_of_3", "trên 3 lượt")}`}>
                        {[1, 2, 3].map(i => (
                          <HyperIcon key={i} name="heart" className={`hyper-heart ${i > game.lives ? "hyper-heart--empty" : ""}`} />
                        ))}
                      </div>
                    </div>

                    <div className="hyper-sidebar-support">
                      <div className="hyper-support-list">
                        <SupportButton iconName="hint" label={t("hint", "Gợi ý")} stock={game.supportStock.hint} onClick={doHint} />
                        <SupportButton iconName="shuffle" label={t("shuffle", "Đảo")} stock={game.supportStock.shuffle} onClick={doShuffle} />
                        <SupportButton iconName="bomb" label={t("bomb", "Bom")} stock={game.supportStock.bomb} onClick={doBomb} />
                      </div>
                    </div>

                    <div className="hyper-sidebar-footer">
                      <button
                        type="button"
                        onClick={() => { playSfx("click"); setShowDashboard(true); }}
                        className="hyper-action-orb flex items-center justify-center"
                        aria-label={t("open_leaderboard", "Mở bảng xếp hạng")}
                      >
                        <HyperIcon name="trophy" className="hyper-action-orb-icon" />
                      </button>
                      <button
                          type="button"
                        onClick={() => { playSfx("click"); setManualPause(true); }}
                        className="hyper-action-orb flex items-center justify-center"
                        aria-label={t("pause", "Tạm dừng")}
                      >
                        <Pause size={24} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </div>
              </aside>

              <div className="hyper-board-stage relative flex h-full min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden self-stretch">
                <GameBoard
                  tiles={game.tiles}
                  selectedIds={game.selectedIds}
                  wrongIds={game.wrongIds}
                  hintIds={game.hintIds}
                  activePath={game.activePath}
                  onSelect={game.selectTile}
                  level={game.level}
                  combo={game.combo}
                  isPaused={isPaused}
                />
                {game.wrongIds.length === 2 && game.wrongReason && <WrongToast reason={game.wrongReason} />}
                {game.shuffleNotice && <ShuffleToast />}
              </div>
            </div>
          </div>

          {/* Mobile Power-up Footer */}
          <div className="mobile-power-up-footer lg:hidden mt-2 flex justify-center items-center shrink-0">
            <div className="hyper-panel flex items-center justify-center gap-6 px-6 py-3 rounded-[2rem] border-2 border-[#d2aa6f] shadow-xl">
              <SupportButton compact iconName="hint" label={t("hint", "Gợi ý")} stock={game.supportStock.hint} onClick={doHint} />
              <SupportButton compact iconName="shuffle" label={t("shuffle", "Đảo")} stock={game.supportStock.shuffle} onClick={doShuffle} />
              <SupportButton compact iconName="bomb" label={t("bomb", "Bom")} stock={game.supportStock.bomb} onClick={doBomb} />
            </div>
          </div>
        </section>
      </div>

      {showPause && (
        <PauseOverlay
          onClose={handleContinue}
          sfxEnabled={game.sfxEnabled}
          musicEnabled={game.musicEnabled}
          setSfxEnabled={game.setSfxEnabled}
          setMusicEnabled={game.setMusicEnabled}
          pauseReason={lifecycle.pauseReason}
          canContinue={lifecycle.canContinue}
        />
      )}
      {showDashboard && (
        <DashboardScreen
          score={game.score}
          stats={game.stats}
          onClose={handleCloseDashboard}
        />
      )}
      {game.status === "won" && (
        <WinOverlay
          score={game.score}
          onNextLevel={handleNextLevel}
          onShowScores={() => setShowDashboard(true)}
          game={game}
          onAdStart={handleAdStart}
          onAdEnd={handleAdEnd}
        />
      )}
      {game.status === "lost" && (
        <LoseOverlay
          score={game.score}
          onPlayAgain={handleRestart}
          game={game}
          reason={game.loseReason}
          onAdStart={handleAdStart}
          onAdEnd={handleAdEnd}
        />
      )}
      {game.status === "revive" && (
        <ReviveOverlay
          game={game}
          onAdStart={handleAdStart}
          onAdEnd={handleAdEnd}
        />
      )}
      {adPromptItem && (
        <AdPromptOverlay
          itemType={adPromptItem}
          onConfirm={() => {
            game.addSupport(adPromptItem);
            setAdPromptItem(null);
          }}
          onCancel={() => setAdPromptItem(null)}
          onAdStart={handleAdStart}
          onAdEnd={handleAdEnd}
        />
      )}
    </main>
  );
}

function DesktopTimer({ timeLeft, maxTime, isPaused }: { timeLeft: number; maxTime: number; isPaused?: boolean }) {
  const { t } = useTranslation();
  const progress = Math.max(0, Math.min(100, (timeLeft / Math.max(1, maxTime)) * 100));
  // Color shifts: >50% green-cyan, 25-50% yellow-orange, <25% orange-red
  const fillColor =
    progress > 50
      ? "linear-gradient(0deg, #ffe330 0%, #5bea2d 38%, #21e8dc 70%, #24c8ff 100%)"
      : progress > 25
        ? "linear-gradient(0deg, #ff8c1a 0%, #ffd230 60%, #ffee80 100%)"
        : "linear-gradient(0deg, #c83b4d 0%, #ff6a30 50%, #ffb830 100%)";

  return (
    <div className="hyper-timer" aria-label={`${t("time", "Thời gian")} ${timeLeft}s`}>
      <div className="hyper-timer-clock">
        <HyperIcon name="clock" />
      </div>
      <div className="hyper-timer-track" aria-hidden="true">
        {/* fill sits at BOTTOM, shrinks upward = countdown */}
        <span style={{ height: `${progress}%`, background: fillColor }} />
      </div>
    </div>
  );
}

function MobileGameHeader({
  timeLeft,
  maxTime,
  score,
  lives,
  onDashboard,
  onSettings,
}: {
  timeLeft: number;
  maxTime: number;
  score: number;
  lives: number;
  onDashboard: () => void;
  onSettings: () => void;
}) {
  const { t } = useTranslation();
  const timeProgress = Math.max(0, Math.min(100, (timeLeft / Math.max(1, maxTime)) * 100));
  return (
    <header className="game-mobile-header flex flex-col shrink-0 gap-2 pb-2 lg:hidden px-2 pt-2">
      {/* Timer and primary controls stay in the top row on phones. */}
      <div className="flex items-center gap-2">
        <div className="game-mobile-progress hyper-panel flex min-w-0 flex-1 items-center gap-1.5 rounded-xl px-3 py-2">
          <HyperIcon name="clock" className="h-5 w-5 shrink-0 object-contain" />
          <div className="game-mobile-progress-track min-w-0 flex-1" aria-hidden="true">
            <div className="game-mobile-progress-fill" style={{ width: `${timeProgress}%` }} />
          </div>
          <span className="shrink-0 text-xs font-black text-[var(--game-ink-muted)]">{timeLeft}s</span>
        </div>

        <div className="hyper-panel hyper-mobile-actions flex items-center justify-center gap-1.5 p-1 rounded-xl border border-[#d2aa6f] shrink-0">
          <button
            type="button"
            onClick={() => { playSfx("click"); onDashboard(); }}
            aria-label={t("open_leaderboard", "Mở bảng xếp hạng")}
            className="hyper-action-orb-mobile flex items-center justify-center shrink-0"
          >
            <HyperIcon name="trophy" className="hyper-action-orb-icon" />
          </button>
          <button
            type="button"
            onClick={() => { playSfx("click"); onSettings(); }}
            aria-label={t("pause", "Tạm dừng")}
            className="hyper-action-orb-mobile flex items-center justify-center shrink-0"
          >
            <Pause size={24} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Second Row: Hearts + Score (Centered & Enlarged) */}
      <div className="game-mobile-stats flex w-full items-center justify-center">
        <div className="game-mobile-stats-panel hyper-panel flex items-center justify-center gap-3 rounded-2xl px-5 py-1.5 border border-[#d2aa6f]">
          {/* Hearts */}
          <div className="flex gap-1">
            {[1, 2, 3].map(i => (
              <HyperIcon key={i} name="heart" className={`w-6 h-6 object-contain ${i <= lives ? "" : "grayscale opacity-50"}`} />
            ))}
          </div>
          <div className="h-6 w-[2px] bg-[#d2aa6f]/50 mx-1 rounded-full"></div>
          {/* Score */}
          <div className="flex items-center gap-1.5">
            <HyperIcon name="trophy" className="h-6 w-6 object-contain" />
            <span className="text-base font-black text-[#f4771a] drop-shadow-sm">{score.toLocaleString("vi-VN")}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function SupportButton({
  iconName,
  label,
  stock = 0,
  onClick,
  compact = false,
  mini = false,
}: {
  iconName: HyperIconName;
  label: string;
  stock?: number;
  onClick: () => void;
  compact?: boolean;
  mini?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`hyper-support-button ${mini ? "hyper-support-button--mini" : compact ? "hyper-support-button--compact" : ""}`}
    >
      <HyperIcon name={iconName} className="hyper-support-icon" />
      {!compact && !mini && <span className="hyper-support-label">{label}</span>}
      <span className={`hyper-support-counter ${stock > 0 ? 'hyper-support-counter--has-stock' : ''}`} aria-hidden="true">
        x{stock}
      </span>
    </button>
  );
}
