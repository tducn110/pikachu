import React, { useState, useEffect } from "react";
import { type UsePairMatchGame } from "../../hooks/usePairMatchGame";
import { type LoseReason } from "../../hooks/useGameSession";
import { HyperModal } from "./overlays/HyperModal";
import { RewardAdButton } from "./ui/RewardAdButton";
import { HyperModalButton } from "./ui/HyperModalButton";
import { HyperIcon } from "./hyperUi";
import { RotateCcw } from "lucide-react";

export function LoseOverlay({
  score,
  onPlayAgain,
  game,
  reason,
}: {
  score: number;
  onPlayAgain: () => void;
  game: UsePairMatchGame;
  reason: LoseReason | null;
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

  const title = reason === "timeout" ? "HẾT THỜI GIAN!" : "HẾT TIM!";
  const icon = reason === "timeout" ? "clock" : "heart";

  return (
    <HyperModal>
      <div className="mb-2">
        <HyperIcon name={icon} className="w-16 h-16 drop-shadow-md mx-auto" />
      </div>
      
      <h2 className="text-3xl font-black text-[var(--hyper-purple-ink)] uppercase mb-4 shadow-text">
        {title}
      </h2>

      <div className="text-[var(--hyper-purple-deep)] font-black text-xl mb-1 uppercase tracking-wide">
        ĐIỂM
      </div>
      
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
        <div className={doubleClaimed ? "w-full" : "flex-1"}>
          <HyperModalButton onClick={onPlayAgain} variant="secondary">
            <div className="flex items-center justify-center gap-2">
              <RotateCcw size={18} />
              CHƠI LẠI
            </div>
          </HyperModalButton>
        </div>
      </div>
    </HyperModal>
  );
}
