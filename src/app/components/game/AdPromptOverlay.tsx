import React from "react";
import { HyperModal } from "./overlays/HyperModal";
import { RewardAdButton } from "./ui/RewardAdButton";
import { HyperModalButton } from "./ui/HyperModalButton";
import { HyperIcon } from "./hyperUi";

interface AdPromptOverlayProps {
  itemType: "hint" | "shuffle" | "bomb";
  onConfirm: () => void;
  onCancel: () => void;
}

export function AdPromptOverlay({ itemType, onConfirm, onCancel }: AdPromptOverlayProps) {
  const itemNames = {
    hint: "Gợi ý",
    shuffle: "Đảo bàn",
    bomb: "Bom phá"
  };

  return (
    <HyperModal>
      <div className="mb-4">
        <HyperIcon name={itemType} className="w-16 h-16 drop-shadow-md mx-auto" />
      </div>
      
      <h2 className="text-3xl font-black text-[var(--hyper-purple-ink)] uppercase mb-2">
        THÊM {itemNames[itemType]}
      </h2>
      
      <div className="text-[var(--hyper-ink)] text-lg font-bold mb-6 px-2">
        +1 lượt
      </div>

      <div className="flex flex-col w-full gap-3 mt-auto">
        <RewardAdButton 
          rewardType="support" 
          onSuccess={onConfirm} 
          label="XEM QUẢNG CÁO" 
          subLabel="+1 LƯỢT" 
        />
        <HyperModalButton onClick={onCancel} variant="secondary">
          Để sau
        </HyperModalButton>
      </div>
    </HyperModal>
  );
}
