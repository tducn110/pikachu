import { useState } from "react";
import { RotateCcw, Lightbulb, Settings } from "lucide-react";
import { usePairMatchGame } from "../../hooks/usePairMatchGame";
import { CountrysideBackdrop } from "./CountrysideBackdrop";
import { GameBoard } from "./GameBoard";
import { GameHUD } from "./GameHUD";
import { Mascot } from "./Mascot";
import { palette as c } from "./gameThemes";
import { GAME_CONFIG } from "../../constants/config";

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
  
  const isPaused = showSettings || showScores;
  const game = usePairMatchGame({ isPaused });

  return (
    <div className="relative w-full min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-4 pt-20 font-sans text-[#2a2418]">
      <CountrysideBackdrop />

      <div className="relative w-full max-w-3xl rounded-3xl p-5 md:p-8 bg-[#fdf6ea]/92 border-[1.5px] border-[#8a7d65]/30 shadow-[0_14px_40px_rgba(42,36,24,0.18)] backdrop-blur-sm">
        {/* top action buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <ActionButton
            onClick={game.resetGame}
            icon={<RotateCcw size={16} />}
            label="Chơi lại"
            primary
          />
          <ActionButton
            onClick={game.hintPair}
            icon={<Lightbulb size={16} />}
            label="Gợi ý"
          />
          <ActionButton
            onClick={() => setShowSettings(true)}
            icon={<Settings size={16} />}
            label="Cài đặt"
          />
        </div>

        {/* title + mascot */}
        <div className="mt-4 md:mt-6 flex flex-col sm:flex-row items-center gap-3 md:gap-5 text-center sm:text-left">
          <Mascot className="w-14 h-14 md:w-20 md:h-20 shrink-0" />
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold leading-tight text-[#2a2418]">
              {GAME_CONFIG.TITLE}
            </h1>
            <p className="text-[13px] md:text-[15px] text-[#8a7d65] mt-1 font-medium">
              {GAME_CONFIG.SUBTITLE}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <GameHUD
            score={game.score}
            level={game.level}
            moves={game.moves}
            remainingPairs={game.remainingPairs}
            combo={game.combo}
            timeLeft={game.timeLeft}
            maxTime={game.maxTime}
          />
        </div>

        {/* board */}
        <div className="relative mt-4">
          <GameBoard
            tiles={game.tiles}
            selectedIds={game.selectedIds}
            wrongIds={game.wrongIds}
            hintIds={game.hintIds}
            activePath={game.activePath}
            onSelect={game.selectTile}
            level={game.level}
          />

          {/* wrong feedback toast */}
          {game.wrongIds.length === 2 && <WrongToast />}
          
          {/* shuffle feedback toast */}
          {game.shuffleNotice && <ShuffleToast />}

          {/* win overlay */}
          {game.status === "won" && (
            <WinOverlay
              score={game.score}
              onNextLevel={game.nextLevel}
              onShowScores={() => setShowScores(true)}
            />
          )}

          {/* lose overlay */}
          {game.status === "lost" && (
            <LoseOverlay
              score={game.score}
              onPlayAgain={game.resetGame}
            />
          )}
        </div>
      </div>

      {/* settings modal */}
      {showSettings && (
        <SettingsOverlay
          onClose={() => setShowSettings(false)}
          sfxEnabled={game.sfxEnabled}
          musicEnabled={game.musicEnabled}
          setSfxEnabled={game.setSfxEnabled}
          setMusicEnabled={game.setMusicEnabled}
        />
      )}

      {/* scoreboard modal */}
      {showScores && (
        <ScoresOverlay
          onClose={() => setShowScores(false)}
          stats={game.stats}
        />
      )}

      <style>{`@keyframes bolac-fade { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </div>
  );
}
