import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { type UsePairMatchGame } from "../../hooks/usePairMatchGame";
import { HyperModal } from "./overlays/HyperModal";
import { RewardAdButton } from "./ui/RewardAdButton";
import { HyperModalButton } from "./ui/HyperModalButton";
import { HyperIcon } from "./hyperUi";
import { RotateCcw } from "lucide-react";

export function WinOverlay({
  score,
  onNextLevel,
  onShowScores,
  game,
  onAdStart,
  onAdEnd,
}: {
  score: number;
  onNextLevel: () => void;
  onShowScores: () => void;
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
    <HyperModal>
      <div className="mb-2 text-6xl text-[var(--hyper-orange)] drop-shadow-md">
        ✦
      </div>
      
      <h2 className="text-3xl font-black text-[var(--hyper-purple-ink)] uppercase mb-4 shadow-text">
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
        <div className="flex w-full gap-2 items-center">
          <HyperModalButton onClick={onNextLevel} variant="secondary" className="flex-1">
            {t("continue", "TIẾP TỤC")}
          </HyperModalButton>
          {!doubleClaimed && (
            <HyperModalButton
              onClick={onShowScores}
              variant="secondary"
              className="w-14 h-12 shrink-0 px-0 flex items-center justify-center rounded-full"
              aria-label={t("open_leaderboard", "Mở bảng xếp hạng")}
            >
              <HyperIcon name="trophy" className="w-6 h-6 mx-auto opacity-80" />
            </HyperModalButton>
          )}
        </div>
      </div>
    </HyperModal>
  );
}
