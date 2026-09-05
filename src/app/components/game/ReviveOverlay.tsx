import React from "react";
import { useTranslation } from "react-i18next";
import { type UsePairMatchGame } from "../../hooks/usePairMatchGame";
import { HyperModal } from "./overlays/HyperModal";
import { RewardAdButton } from "./ui/RewardAdButton";
import { HyperModalButton } from "./ui/HyperModalButton";
import { HyperIcon } from "./hyperUi";

interface ReviveOverlayProps {
  game: UsePairMatchGame;
}

export function ReviveOverlay({ game }: ReviveOverlayProps) {
  const { t } = useTranslation();
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
      
      <h2 className="text-2xl font-black text-[var(--hyper-purple-ink)] uppercase mb-6">
        {t("you_lose", "BẠN ĐÃ THUA!")}
      </h2>

      <div className="flex flex-col w-full gap-3 mt-auto">
        <RewardAdButton 
          rewardType="revive" 
          onSuccess={handleRevive} 
          label={t("revive_upper", "HỒI SINH")}
        />
        <HyperModalButton onClick={handleGiveUp} variant="secondary">
          {t("give_up", "Bỏ cuộc")}
        </HyperModalButton>
      </div>
    </HyperModal>
  );
}
