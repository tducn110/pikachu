import React, { useState } from "react";
import { requestRewardedAd, RewardType } from "../../../utils/ads";
import { HyperModalButton } from "./HyperModalButton";
import { Clapperboard } from "lucide-react";

interface RewardAdButtonProps {
  rewardType: RewardType;
  onSuccess: () => void;
  label: string;
  subLabel?: string;
  beforeAd?: () => void; // ponytail: caller owns mute/pause logic
  afterAd?: () => void;
}

export function RewardAdButton({ rewardType, onSuccess, label, subLabel, beforeAd, afterAd }: RewardAdButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    const result = await requestRewardedAd(rewardType, { beforeAd, afterAd });
    setLoading(false);
    if (result === "success") onSuccess();
  };

  return (
    <HyperModalButton onClick={handleClick} variant="primary" disabled={loading} className="hyper-reward-btn">
      <div className="flex flex-col items-center justify-center w-full relative">
        <div className="flex items-center gap-2 font-bold text-white text-lg tracking-wide uppercase shadow-text">
          <Clapperboard className="w-5 h-5" />
          {loading ? "ĐANG TẢI..." : label}
        </div>
        {subLabel && !loading && (
          <div className="text-yellow-200 text-sm font-bold shadow-text mt-0.5">
            {subLabel}
          </div>
        )}
      </div>
    </HyperModalButton>
  );
}
