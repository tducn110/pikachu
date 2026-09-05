import React from "react";
import { useTranslation } from "react-i18next";
import { HyperModal } from "./overlays/HyperModal";
import { RewardAdButton } from "./ui/RewardAdButton";
import { HyperModalButton } from "./ui/HyperModalButton";
import { HyperIcon } from "./hyperUi";

interface AdPromptOverlayProps {
  itemType: "hint" | "shuffle" | "bomb";
  onConfirm: () => void;
  onCancel: () => void;
  onAdStart?: () => void;
  onAdEnd?: () => void;
}

export function AdPromptOverlay({ itemType, onConfirm, onCancel, onAdStart, onAdEnd }: AdPromptOverlayProps) {
  const { t } = useTranslation();
  const itemNames = {
    hint: t("hint", "Gợi ý"),
    shuffle: t("shuffle", "Đảo bàn"),
    bomb: t("bomb", "Bom phá")
  };

  return (
    <HyperModal>
      <div className="mb-4">
        <HyperIcon name={itemType} className="w-16 h-16 drop-shadow-md mx-auto" />
      </div>
      
      <h2 className="text-3xl font-black text-[var(--hyper-purple-ink)] uppercase mb-2">
        {t("add_item", "THÊM")} {itemNames[itemType]}
      </h2>
      
      <div className="text-[var(--hyper-ink)] text-lg font-bold mb-6 px-2">
        {t("plus_1_turn", "+1 lượt")}
      </div>

      <div className="flex flex-col w-full gap-3 mt-auto">
        <RewardAdButton 
          rewardType="support" 
          onSuccess={onConfirm} 
          label={t("watch_ad", "XEM QUẢNG CÁO")}
          subLabel={t("plus_1_turn_caps", "+1 LƯỢT")}
          beforeAd={onAdStart}
          afterAd={onAdEnd}
        />
        <HyperModalButton onClick={onCancel} variant="secondary">
          {t("maybe_later", "Để sau")}
        </HyperModalButton>
      </div>
    </HyperModal>
  );
}
