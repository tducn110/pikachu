import React from "react";
import { RotateCcw } from "lucide-react";
import { Mascot } from "./Mascot";
import { ActionButton } from "./ActionButton";
import { HyperIcon } from "./hyperUi";

export function WinOverlay({
  score,
  onNextLevel,
  onShowScores,
}: {
  score: number;
  onNextLevel: () => void;
  onShowScores: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Chiến thắng"
      className="hyper-modal-backdrop absolute"
    >
      <div className="hyper-result-card">
        <div className="hyper-result-inner">
        <Mascot className="w-16 h-16 md:w-20 md:h-20" />
        <h2 className="mt-4">
          Ghép xong rồi!
        </h2>
        <p className="mt-1">
          Bạn đã tìm hết các cặp
        </p>
        <div className="hyper-result-score">
          Điểm: {score}
        </div>
        <div className="hyper-result-actions">
          <ActionButton
            onClick={onNextLevel}
            icon={<RotateCcw size={16} />}
            label="Chơi tiếp"
            primary
            sound={false}
          />
          <ActionButton
            onClick={onShowScores}
            icon={<HyperIcon name="trophy" className="h-6 w-6 object-contain" />}
            label="Bảng điểm"
          />
        </div>
        </div>
      </div>
    </div>
  );
}
