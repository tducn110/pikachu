import { useState } from "react";
import { playSfx } from "../../utils/audio";
import { usePairMatchGame } from "../../hooks/usePairMatchGame";
import { getBoardSize } from "../../utils/pairMatchLogic";
import { GameBoard } from "./GameBoard";
import { PauseOverlay } from "./PauseOverlay";
import { ScoresOverlay } from "./ScoresOverlay";
import { WinOverlay } from "./WinOverlay";
import { LoseOverlay } from "./LoseOverlay";
import { WrongToast } from "./WrongToast";
import { ShuffleToast } from "./ShuffleToast";
import { ReviveOverlay } from "./ReviveOverlay";
import { AdPromptOverlay } from "./AdPromptOverlay";
import { HyperIcon, HyperTitleBar, type HyperIconName } from "./hyperUi";

export function Game() {
  const [showPause, setShowPause] = useState(false);
  const [showScores, setShowScores] = useState(false);
  const [adPromptItem, setAdPromptItem] = useState<"hint" | "shuffle" | "bomb" | null>(null);
  const game = usePairMatchGame({ isPaused: showPause || showScores || adPromptItem !== null });
  const boardSize = getBoardSize(game.level);
  const totalPairs = (boardSize.rows * boardSize.cols) / 2;

  const handleSupportRequest = (type: "hint" | "shuffle" | "bomb", action: () => void) => {
    if (game.supportStock[type] <= 0) {
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
      style={{ backgroundImage: "url('/background.png')" }}
    >
      <div className="hyper-game-atmosphere pointer-events-none absolute inset-0" />

      <div className="hyper-game-viewport relative z-10 mx-auto flex h-full min-h-0 w-full items-center justify-center">
        <section className="hyper-game-stage flex h-full min-h-0 w-full flex-col">
          <MobileGameHeader
            timeLeft={game.timeLeft}
            maxTime={game.maxTime}
            score={game.score}
            remainingPairs={game.remainingPairs}
            totalPairs={totalPairs}
            supportStock={game.supportStock}
            onSettings={() => setShowPause(true)}
            onHint={doHint}
            onShuffle={doShuffle}
            onBomb={doBomb}
          />

          <div className="hyper-game-layout flex min-h-0 min-w-0 flex-1 flex-col lg:grid">
            <aside className="hyper-sidebar hidden min-h-0 lg:block">
              <DesktopTimer timeLeft={game.timeLeft} maxTime={game.maxTime} isPaused={showPause || showScores} />

              <div className="hyper-sidebar-frame">
                <div className="hyper-sidebar-content">
                  <div className="hyper-sidebar-top">
                    <div className="hyper-score-card">
                      <HyperTitleBar className="hyper-score-title">Điểm</HyperTitleBar>
                      <button
                        type="button"
                        className="hyper-score-total"
                        onClick={() => { playSfx("click"); setShowScores(true); }}
                        aria-label="Mở bảng điểm"
                      >
                        {game.score.toLocaleString("vi-VN")}
                      </button>
                      {game.combo >= 2 && (
                        <div className="hyper-score-combo" aria-label={`Combo ×${game.combo}`}>
                          <span>×{game.combo}</span>
                        </div>
                      )}
                    </div>

                    <div className="hyper-hearts-panel" aria-label={`${game.lives} trên 3 lượt`}>
                      {[1, 2, 3].map(i => (
                        <HyperIcon key={i} name="heart" className={`hyper-heart ${i > game.lives ? "hyper-heart--empty" : ""}`} />
                      ))}
                    </div>
                  </div>

                  <div className="hyper-sidebar-support">
                    <HyperTitleBar className="hyper-support-title">Vật phẩm hỗ trợ</HyperTitleBar>
                    <div className="hyper-support-list">
                      <SupportButton iconName="hint" label="Gợi ý" stock={game.supportStock.hint} onClick={doHint} />
                      <SupportButton iconName="shuffle" label="Đảo" stock={game.supportStock.shuffle} onClick={doShuffle} />
                      <SupportButton iconName="bomb" label="Bom" stock={game.supportStock.bomb} onClick={doBomb} />
                    </div>
                  </div>

                  <div className="hyper-sidebar-footer">
                    <button
                      type="button"
                      onClick={() => { playSfx("click"); setShowPause(true); }}
                      className="hyper-pause-orb"
                      aria-label="Tạm dừng"
                    >
                      <span className="hyper-pause-icon" aria-hidden="true">Ⅱ</span>
                    </button>
                  </div>
                </div>
              </div>
            </aside>

            <div className="relative flex h-full min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden self-stretch">
              <GameBoard
                tiles={game.tiles}
                selectedIds={game.selectedIds}
                wrongIds={game.wrongIds}
                hintIds={game.hintIds}
                activePath={game.activePath}
                onSelect={game.selectTile}
                level={game.level}
                combo={game.combo}
              />
            {game.wrongIds.length === 2 && game.wrongReason && <WrongToast reason={game.wrongReason} />}
              {game.shuffleNotice && <ShuffleToast />}
              {game.status === "won" && (
                <WinOverlay score={game.score} onNextLevel={game.nextLevel} onShowScores={() => setShowScores(true)} game={game} />
              )}
              {game.status === "lost" && <LoseOverlay score={game.score} onPlayAgain={game.resetGame} game={game} reason={game.loseReason} />}
              {game.status === "revive" && <ReviveOverlay game={game} />}
              {adPromptItem && (
                <AdPromptOverlay
                  itemType={adPromptItem}
                  onConfirm={() => {
                    game.addSupport(adPromptItem);
                    setAdPromptItem(null);
                  }}
                  onCancel={() => setAdPromptItem(null)}
                />
              )}
            </div>
          </div>

        </section>
      </div>

      {showPause && (
        <PauseOverlay
          onClose={() => setShowPause(false)}
          onRestart={game.resetGame}
          sfxEnabled={game.sfxEnabled}
          musicEnabled={game.musicEnabled}
          setSfxEnabled={game.setSfxEnabled}
          setMusicEnabled={game.setMusicEnabled}
        />
      )}
      {showScores && <ScoresOverlay onClose={() => setShowScores(false)} stats={game.stats} />}
    </main>
  );
}

function DesktopTimer({ timeLeft, maxTime, isPaused }: { timeLeft: number; maxTime: number; isPaused?: boolean }) {
  const progress = Math.max(0, Math.min(100, (timeLeft / Math.max(1, maxTime)) * 100));
  // Color shifts: >50% green-cyan, 25-50% yellow-orange, <25% orange-red
  const fillColor =
    progress > 50
      ? "linear-gradient(0deg, #ffe330 0%, #5bea2d 38%, #21e8dc 70%, #24c8ff 100%)"
      : progress > 25
        ? "linear-gradient(0deg, #ff8c1a 0%, #ffd230 60%, #ffee80 100%)"
        : "linear-gradient(0deg, #c83b4d 0%, #ff6a30 50%, #ffb830 100%)";

  return (
    <div className="hyper-timer" aria-label={`Thời gian còn lại ${timeLeft} giây`}>
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

function InfoItem({ icon, label, value, accent }: { icon: HyperIconName; label: string; value: string; accent: string }) {
  return (
    <div className="hyper-info-row">
      <HyperIcon name={icon} className="hyper-info-icon" />
      <span className="hyper-info-label">{label}</span>
      <span className={`hyper-info-value ${accent}`}>{value}</span>
    </div>
  );
}

function MobileGameHeader({
  timeLeft,
  maxTime,
  score,
  remainingPairs,
  totalPairs,
  supportStock,
  onSettings,
  onHint,
  onShuffle,
  onBomb,
}: {
  timeLeft: number;
  maxTime: number;
  score: number;
  remainingPairs: number;
  totalPairs: number;
  supportStock: { hint: number; shuffle: number; bomb: number };
  onSettings: () => void;
  onHint: () => void;
  onShuffle: () => void;
  onBomb: () => void;
}) {
  const timeProgress = Math.max(0, Math.min(100, (timeLeft / maxTime) * 100));

  return (
    <header className="game-mobile-header flex flex-col shrink-0 gap-4 pb-4 lg:hidden">
      <div className="game-mobile-top flex items-center justify-between gap-2">
          <HyperTitleBar className="hyper-title-bar--small">Ghép đôi</HyperTitleBar>
        <button
          type="button"
          onClick={() => { playSfx("click"); onSettings(); }}
          aria-label="Tạm dừng"
          className="hyper-icon-button shrink-0"
        >
          <span className="hyper-pause-icon" style={{ fontSize: "1.2rem", color: "inherit", textShadow: "none" }} aria-hidden="true">Ⅱ</span>
        </button>
      </div>

      <div className="game-mobile-progress hyper-panel flex items-center gap-2 rounded-[16px] px-2.5 py-2">
        <HyperIcon name="clock" className="h-7 w-7 shrink-0 object-contain" />
        <div className="h-3 min-w-0 flex-1 overflow-hidden rounded-full border border-[#d2aa6f] bg-[#f6d7a2] p-0.5">
          <div className="h-full rounded-full bg-gradient-to-r from-[#ffbe2e] to-[#ff8a18]" style={{ width: `${timeProgress}%` }} />
        </div>
        <span className="shrink-0 text-sm font-black text-[#8b5a22]">{timeLeft}s</span>
      </div>

      <div className="game-mobile-stats flex justify-center gap-2">
        <div className="w-2/3 min-w-[200px]">
          <InfoItem icon="trophy" label="Điểm" value={score.toLocaleString("vi-VN")} accent="text-[#f4771a]" />
        </div>
      </div>

      <div className="game-mobile-actions grid grid-cols-3 gap-2">
        <SupportButton compact iconName="hint" label="Gợi ý" stock={supportStock.hint} onClick={onHint} />
        <SupportButton compact iconName="shuffle" label="Đảo" stock={supportStock.shuffle} onClick={onShuffle} />
        <SupportButton compact iconName="bomb" label="Bom" stock={supportStock.bomb} onClick={onBomb} />
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
}: {
  iconName: HyperIconName;
  label: string;
  stock?: number;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`hyper-support-button ${compact ? "hyper-support-button--compact" : ""}`}
    >
      <HyperIcon name={iconName} className="hyper-support-icon" />
      {!compact && <span className="hyper-support-label">{label}</span>}
      <span className={`hyper-support-counter ${stock > 0 ? 'hyper-support-counter--has-stock' : ''}`} aria-hidden="true">
        x{stock}
      </span>
    </button>
  );
}
