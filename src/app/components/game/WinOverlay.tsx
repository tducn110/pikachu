import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { type UsePairMatchGame } from "../../hooks/usePairMatchGame";
import { HyperModal } from "./overlays/HyperModal";
import { RewardAdButton } from "./ui/RewardAdButton";
import { HyperModalButton } from "./ui/HyperModalButton";
import { RotateCcw } from "lucide-react";

export function WinOverlay({
  score,
  onNextLevel,
  onRestart,
  game,
  onAdStart,
  onAdEnd,
}: {
  score: number;
  onNextLevel: () => void;
  onRestart: () => void;
  game: UsePairMatchGame;
  onAdStart?: () => void;
  onAdEnd?: () => void;
}) {
  const [doubleClaimed, setDoubleClaimed] = useState(false);
  const [displayScore, setDisplayScore] = useState(score);
  const { t } = useTranslation();

  useEffect(() => {
    setDisplayScore(score);
  }, [score]);

  const handleDoubleScore = () => {
    game.doubleScore();
    setDoubleClaimed(true);
  };

  return (
    <HyperModal labelledBy="win-title">
      <div className="mb-2 text-6xl text-[var(--hyper-orange)] drop-shadow-md">
        ✦
      </div>
      
      <h2 id="win-title" className="text-3xl font-black text-[var(--hyper-purple-ink)] uppercase mb-4 shadow-text">
        {t("completed", "HOÀN THÀNH!")}
      </h2>
      
      <div className={`text-[var(--hyper-orange)] font-black text-5xl mb-8 drop-shadow-md hyper-score-animate ${doubleClaimed ? 'doubling' : ''}`}>
        {displayScore}
      </div>

      <div className="flex flex-col w-full gap-3 mt-auto">
        {!doubleClaimed && (
          <RewardAdButton
            rewardType="x2"
            onSuccess={handleDoubleScore}
            label={t("x2_score_upper", "X2 ĐIỂM")}
            beforeAd={onAdStart}
            afterAd={onAdEnd}
          />
        )}
        <div className="win-overlay-actions">
          <HyperModalButton onClick={onNextLevel} variant="secondary" className="win-overlay-continue">
            {t("continue", "TIẾP TỤC")}
          </HyperModalButton>
        </div>
        <HyperModalButton onClick={onRestart} variant="secondary">
          <span className="flex items-center justify-center gap-2">
            <RotateCcw size={18} />
            {t("play_again", "CHƠI LẠI")}
          </span>
        </HyperModalButton>
      </div>
    </HyperModal>
  );
}
