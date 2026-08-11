import React from "react";
import { RotateCcw } from "lucide-react";
import { Mascot } from "./Mascot";
import { ActionButton } from "./ActionButton";

export function LoseOverlay({
  score,
  onPlayAgain,
}: {
  score: number;
  onPlayAgain: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Thất bại"
      className="hyper-modal-backdrop absolute"
    >
      <div className="hyper-result-card">
        <div className="hyper-result-inner">
        <div className="grayscale opacity-80 flex justify-center mb-2">
          <Mascot className="w-16 h-16 md:w-20 md:h-20" />
        </div>
        <h2 className="mt-4">
          Hết thời gian!
        </h2>
        <p className="mt-1">
          Bạn chưa kịp tìm hết các cặp
        </p>
        <div className="hyper-result-score">
          Điểm: {score}
        </div>
        <div className="hyper-result-actions">
          <ActionButton
            onClick={onPlayAgain}
            icon={<RotateCcw size={16} />}
            label="Chơi lại"
            primary
            sound={false}
          />
        </div>
        </div>
      </div>
    </div>
  );
}
