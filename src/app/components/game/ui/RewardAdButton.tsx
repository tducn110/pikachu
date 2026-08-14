import React, { useState } from "react";
import { requestRewardedAd, RewardType } from "../../../utils/ads";
import { HyperModalButton } from "./HyperModalButton";
import { MonitorPlay } from "lucide-react";

interface RewardAdButtonProps {
  rewardType: RewardType;
  onSuccess: () => void;
  label: string;
  subLabel?: string;
}

export function RewardAdButton({ rewardType, onSuccess, label, subLabel }: RewardAdButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    const result = await requestRewardedAd(rewardType);
    setLoading(false);
    if (result === "success") {
      onSuccess();
    }
  };

  return (
    <HyperModalButton onClick={handleClick} variant="primary" disabled={loading} className="hyper-reward-btn">
      <div className="flex flex-col items-center justify-center w-full relative">
        <div className="flex items-center gap-2 font-bold text-white text-lg tracking-wide uppercase shadow-text">
          <MonitorPlay className="w-5 h-5 fill-white" />
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
