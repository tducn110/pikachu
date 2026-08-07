import { useState } from "react";
import { Bomb, Clock3, Lightbulb, RotateCcw, Settings, Shuffle, Target } from "lucide-react";
import { usePairMatchGame } from "../../hooks/usePairMatchGame";
import { getBoardSize } from "../../utils/pairMatchLogic";
import { GameBoard } from "./GameBoard";
import { ActionButton } from "./ActionButton";
import { SettingsOverlay } from "./SettingsOverlay";
import { ScoresOverlay } from "./ScoresOverlay";
import { WinOverlay } from "./WinOverlay";
import { LoseOverlay } from "./LoseOverlay";
import { WrongToast } from "./WrongToast";
import { ShuffleToast } from "./ShuffleToast";

export function Game() {
  const [showSettings, setShowSettings] = useState(false);
  const [showScores, setShowScores] = useState(false);
  const game = usePairMatchGame({ isPaused: showSettings || showScores });
  const boardSize = getBoardSize(game.level);
  const totalPairs = (boardSize.rows * boardSize.cols) / 2;

  return (
    <main
      className="relative h-[100dvh] overflow-hidden bg-[#dcecff] bg-cover bg-center bg-fixed p-1 font-sans text-[#18324f] sm:p-3 lg:p-4"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.34),transparent_42%),linear-gradient(180deg,rgba(234,244,255,0.08),rgba(234,244,255,0.18))]" />

      <div className="relative z-10 mx-auto flex h-full min-h-0 w-full items-center justify-center">
        <section className="flex h-full min-h-0 w-full max-w-[1460px] flex-col overflow-hidden rounded-[22px] border border-[#dfc59f] bg-[#f7ead0]/92 p-1.5 shadow-[0_30px_70px_rgba(109,73,33,0.22),inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur-[2px] sm:rounded-[30px] sm:p-3 lg:p-4">
          <MobileGameHeader
            timeLeft={game.timeLeft}
            score={game.score}
            remainingPairs={game.remainingPairs}
            totalPairs={totalPairs}
            onSettings={() => setShowSettings(true)}
            onHint={game.hintPair}
            onShuffle={game.shuffleBoard}
            onBomb={game.bombPair}
          />

          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 lg:grid lg:grid-cols-[clamp(220px,22vw,280px)_minmax(0,1fr)] lg:gap-4">
            <aside className="hidden min-h-0 gap-3 lg:flex lg:flex-col">
              <div className="rounded-[24px] border border-[#dfc59f] bg-[#fff4dd] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:p-3">
                <div className="rounded-[16px] border border-[#caa36d] bg-gradient-to-b from-[#8b652f] to-[#6f4f20] px-4 py-2 text-center text-sm font-black uppercase tracking-[0.12em] text-[#fff6df] shadow-[0_6px_14px_rgba(125,88,31,0.24)]">
                  Combo
                </div>
                <div className="mt-2 text-center text-5xl font-black leading-none text-[#8b5a22]">
                  {game.combo}
                </div>
                <div className="mt-3 h-4 rounded-full border border-[#d2aa6f] bg-[#f6d7a2] p-1 shadow-[inset_0_2px_5px_rgba(151,100,29,0.18)]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#ffbe2e] to-[#ff8a18]"
                    style={{ width: `${Math.min(100, Math.max(10, game.combo * 6))}%` }}
                  />
                </div>
              </div>

              <div className="rounded-[24px] border border-[#dfc59f] bg-[#fff4dd] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:p-3">
                <h2 className="rounded-[16px] border border-[#caa36d] bg-gradient-to-b from-[#8b652f] to-[#6f4f20] px-4 py-2 text-center text-sm font-black uppercase tracking-[0.12em] text-[#fff6df] shadow-[0_6px_14px_rgba(125,88,31,0.24)]">
                  Vật phẩm hỗ trợ
                </h2>
                <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                  <SupportButton icon={<Lightbulb />} label="Gợi ý" onClick={game.hintPair} />
                  <SupportButton icon={<Shuffle />} label="Đảo" onClick={game.shuffleBoard} />
                  <SupportButton icon={<Bomb />} label="Bom" onClick={game.bombPair} />
                </div>
              </div>

              <div className="rounded-[24px] border border-[#dfc59f] bg-[#fff4dd] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:p-3">
                <h2 className="rounded-[16px] border border-[#caa36d] bg-gradient-to-b from-[#8b652f] to-[#6f4f20] px-4 py-2 text-center text-sm font-black uppercase tracking-[0.12em] text-[#fff6df] shadow-[0_6px_14px_rgba(125,88,31,0.24)]">
                  Tiến độ
                </h2>
                <div className="mt-3 flex items-center justify-center">
                  <div className="relative h-32 w-32 rounded-full border-[10px] border-[#f1c57a] bg-[#fff6e6] shadow-[inset_0_4px_10px_rgba(147,102,32,0.08)] sm:h-36 sm:w-36 sm:border-[12px]">
                    <div
                      className="absolute inset-0 rounded-full border-[10px] border-transparent border-t-[#ffb51b] border-r-[#ffb51b] sm:border-[12px]"
                      style={{ transform: `rotate(${Math.min(270, (game.remainingPairs / totalPairs) * 270)}deg)` }}
                    />
                    <div className="absolute inset-[22px] flex flex-col items-center justify-center rounded-full bg-[#fff2d6] text-center sm:inset-[26px]">
                      <Target className="h-6 w-6 text-[#c88b2d] sm:h-7 sm:w-7" />
                      <div className="mt-1 text-2xl font-black text-[#8b5a22]">{game.remainingPairs}</div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-[18px] bg-[#fff8eb] px-4 py-3 text-sm font-black text-[#8b5a22]">
                  <span className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-[#c88b2d]" />
                    Thời gian
                  </span>
                  <span className={game.timeLeft < 15 ? "text-[#e24848]" : ""}>{game.timeLeft}s</span>
                </div>
                <div className="mt-2 flex items-center justify-between rounded-[18px] bg-[#fff8eb] px-4 py-3 text-sm font-black text-[#8b5a22]">
                  <span className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4 text-[#c88b2d]" />
                    Điểm
                  </span>
                  <button type="button" onClick={() => setShowScores(true)} className="text-[#d97918] transition hover:opacity-80">
                    {game.score.toLocaleString("vi-VN")}
                  </button>
                </div>
              </div>

              <div className="mt-auto">
                <ActionButton onClick={() => setShowSettings(true)} icon={<Settings size={16} />} label="Cài đặt" primary />
              </div>
            </aside>

            <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center rounded-[20px] border border-[#d8c7a4] bg-[#f7e8cc] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:rounded-[28px] sm:p-3 lg:flex-none">
              <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center rounded-[26px] border-[3px] border-[#e7cfaa] bg-[#f8ecd7] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] sm:p-3 lg:aspect-square lg:h-full lg:w-auto lg:flex-none">
                <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden">
                  <div
                    className="game-board-frame h-auto max-h-full max-w-full"
                    style={{ aspectRatio: `${boardSize.cols}/${boardSize.rows}` }}
                  >
                    <GameBoard
                      tiles={game.tiles}
                      selectedIds={game.selectedIds}
                      wrongIds={game.wrongIds}
                      hintIds={game.hintIds}
                      activePath={game.activePath}
                      onSelect={game.selectTile}
                      level={game.level}
                    />
                  </div>
                </div>

                {game.wrongIds.length === 2 && game.wrongReason && <WrongToast reason={game.wrongReason} />}
                {game.shuffleNotice && <ShuffleToast />}
                {game.status === "won" && (
                  <WinOverlay score={game.score} onNextLevel={game.nextLevel} onShowScores={() => setShowScores(true)} />
                )}
                {game.status === "lost" && <LoseOverlay score={game.score} onPlayAgain={game.resetGame} />}
              </div>
            </div>
          </div>

        </section>
      </div>

      {showSettings && (
        <SettingsOverlay
          onClose={() => setShowSettings(false)}
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

function InfoItem({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-[#d6e9f8] bg-white/80 p-2.5">
      <div className="flex items-center gap-2 text-[#23618e]">
        <span className="rounded-xl bg-[#eaf5ff] p-1.5">{icon}</span>
        <span className="text-[10px] font-black uppercase tracking-wide">{label}</span>
      </div>
      <div className={`mt-1 text-xl font-black ${accent}`}>{value}</div>
    </div>
  );
}

function MobileGameHeader({
  timeLeft,
  score,
  remainingPairs,
  totalPairs,
  onSettings,
  onHint,
  onShuffle,
  onBomb,
}: {
  timeLeft: number;
  score: number;
  remainingPairs: number;
  totalPairs: number;
  onSettings: () => void;
  onHint: () => void;
  onShuffle: () => void;
  onBomb: () => void;
}) {
  const progress = Math.max(0, Math.min(100, ((totalPairs - remainingPairs) / totalPairs) * 100));

  return (
    <header className="game-mobile-header grid shrink-0 gap-2 pb-2 lg:hidden">
      <div className="game-mobile-top grid grid-cols-[1fr_auto] items-center gap-2">
        <h1 className="rounded-[14px] border border-[#caa36d] bg-gradient-to-b from-[#8b652f] to-[#6f4f20] px-3 py-2 text-center text-sm font-black uppercase tracking-[0.12em] text-[#fff6df] shadow-[0_5px_12px_rgba(125,88,31,0.2)]">
          Ghép đôi
        </h1>
        <button
          type="button"
          onClick={onSettings}
          aria-label="Cài đặt"
          className="grid h-10 w-10 place-items-center rounded-full border border-[#caa36d] bg-[#fff8eb] text-[#8b5a22] shadow-[0_4px_10px_rgba(125,88,31,0.16)]"
        >
          <Settings size={19} />
        </button>
      </div>

      <div className="game-mobile-progress flex items-center gap-2 rounded-[16px] border border-[#dfc59f] bg-[#fff8eb] px-2.5 py-2">
        <Target className="h-5 w-5 shrink-0 text-[#a66a1d]" />
        <div className="h-3 min-w-0 flex-1 overflow-hidden rounded-full border border-[#d2aa6f] bg-[#f6d7a2] p-0.5">
          <div className="h-full rounded-full bg-gradient-to-r from-[#ffbe2e] to-[#ff8a18]" style={{ width: `${progress}%` }} />
        </div>
        <span className="game-mobile-inline-stat text-xs font-black text-[#8b5a22]">{timeLeft}s</span>
        <span className="game-mobile-inline-stat text-xs font-black text-[#d97918]">{score.toLocaleString("vi-VN")}</span>
        <span className="shrink-0 text-sm font-black text-[#8b5a22]">{totalPairs - remainingPairs} / {totalPairs}</span>
      </div>

      <div className="game-mobile-stats grid grid-cols-2 gap-2">
        <InfoItem icon={<Clock3 size={16} />} label="Thời gian" value={`${timeLeft}s`} accent="text-[#8b5a22]" />
        <InfoItem icon={<RotateCcw size={16} />} label="Điểm" value={score.toLocaleString("vi-VN")} accent="text-[#d97918]" />
      </div>

      <div className="game-mobile-actions grid grid-cols-3 gap-2">
        <SupportButton compact icon={<Lightbulb size={18} />} label="Gợi ý" onClick={onHint} />
        <SupportButton compact icon={<Shuffle size={18} />} label="Đảo" onClick={onShuffle} />
        <SupportButton compact icon={<Bomb size={18} />} label="Bom" onClick={onBomb} />
      </div>
    </header>
  );
}

function SupportButton({
  icon,
  label,
  onClick,
  compact = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex items-center rounded-[20px] border border-[#d9bf95] bg-[#fff8eb] text-left text-sm font-black text-[#8b5a22] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition hover:-translate-y-0.5 hover:bg-[#fff5de] active:scale-95 ${
        compact ? "min-h-12 flex-col justify-center gap-0.5 px-1.5 py-1.5" : "gap-3 px-3 py-3"
      }`}
    >
      <span className="rounded-full bg-gradient-to-b from-[#8f63d9] to-[#5c35b7] p-2 text-white shadow-[0_6px_12px_rgba(92,53,183,0.24)]">{icon}</span>
      <span className={compact ? "text-[10px] leading-none" : "flex-1"}>{label}</span>
    </button>
  );
}
