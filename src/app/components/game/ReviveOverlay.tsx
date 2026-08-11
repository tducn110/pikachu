import React from "react";
import { type UsePairMatchGame } from "../../hooks/usePairMatchGame";
import { HyperModal } from "./overlays/HyperModal";
import { RewardAdButton } from "./ui/RewardAdButton";
import { HyperModalButton } from "./ui/HyperModalButton";
import { HyperIcon } from "./hyperUi";

interface ReviveOverlayProps {
  game: UsePairMatchGame;
}

export function ReviveOverlay({ game }: ReviveOverlayProps) {
  const handleGiveUp = () => {
    game.setLost("no_lives");
  };

  const handleRevive = () => {
    game.revive(1); // Give them 1 life to continue
  };

  return (
    <HyperModal>
      <div className="mb-2">
        <HyperIcon name="heart" className="w-16 h-16 drop-shadow-md mx-auto grayscale opacity-80" />
      </div>
      
      <h2 className="text-2xl font-black text-[var(--hyper-purple-ink)] uppercase mb-4">
        HẾT TIM!
      </h2>

      <div className="flex justify-center items-center gap-2 mb-6">
        <HyperIcon name="heart" className="w-8 h-8 drop-shadow" />
        <span className="text-xl font-bold text-[var(--hyper-purple-ink)]">→</span>
        <div className="relative">
          <HyperIcon name="heart" className="w-8 h-8 drop-shadow" />
          <span className="absolute -top-2 -right-3 text-xs font-black bg-[var(--hyper-gold)] text-white px-1 rounded-sm shadow">+1</span>
        </div>
      </div>
      
      <div className="text-[var(--hyper-ink)] text-base font-semibold mb-6 px-2 leading-tight">
        +1 Tim để chơi tiếp
      </div>

      <div className="flex flex-col w-full gap-3 mt-auto">
        <RewardAdButton 
          rewardType="revive" 
          onSuccess={handleRevive} 
          label="HỒI SINH" 
          subLabel="+1 TIM" 
        />
        <HyperModalButton onClick={handleGiveUp} variant="secondary">
          Bỏ cuộc
        </HyperModalButton>
      </div>
    </HyperModal>
  );
}
