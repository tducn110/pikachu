import React, { useState, useEffect } from "react";
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
}: {
  score: number;
  onNextLevel: () => void;
  onShowScores: () => void;
  game: UsePairMatchGame;
}) {
  const [doubleClaimed, setDoubleClaimed] = useState(false);
  const [displayScore, setDisplayScore] = useState(score);

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
        HOÀN THÀNH!
      </h2>
      
      <div className={`text-[var(--hyper-orange)] font-black text-5xl mb-8 drop-shadow-md hyper-score-animate ${doubleClaimed ? 'doubling' : ''}`}>
        {displayScore}
      </div>

      <div className="flex w-full gap-3 mt-auto">
        {!doubleClaimed && (
          <div className="flex-1">
            <RewardAdButton 
              rewardType="x2" 
              onSuccess={handleDoubleScore} 
              label="X2 ĐIỂM" 
            />
          </div>
        )}
        <div className={doubleClaimed ? "w-full flex gap-3" : "flex-1 flex flex-col gap-3"}>
          <HyperModalButton onClick={onNextLevel} variant="secondary" className="flex-1">
            TIẾP TỤC
          </HyperModalButton>
          {!doubleClaimed && (
             <HyperModalButton onClick={onShowScores} variant="secondary">
               <HyperIcon name="trophy" className="w-5 h-5 mx-auto opacity-70" />
             </HyperModalButton>
          )}
        </div>
      </div>
    </HyperModal>
  );
}
