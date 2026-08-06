import React from "react";
import { RotateCcw, Trophy } from "lucide-react";
import { Mascot } from "./Mascot";
import { ActionButton } from "./ActionButton";
import { palette as c } from "./gameThemes";

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
      className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 rounded-2xl bg-[#18324f]/35 text-center backdrop-blur-[12px] animate-[bolac-fade_0.25s]"
    >
      <div className="flex w-[85%] max-w-sm flex-col items-center rounded-3xl border-2 border-[#ffcf45] bg-white px-6 py-8 shadow-[0_14px_40px_rgba(51,104,145,0.24)]">
        <Mascot className="w-16 h-16 md:w-20 md:h-20" />
        <h2 className="mt-4 text-2xl font-black text-[#18324f] md:text-3xl">
          Ghép xong rồi!
        </h2>
        <p className="mt-1 text-sm text-[#69819b] md:text-base">
          Bạn đã tìm hết các cặp
        </p>
        <div className="mt-3 text-lg md:text-xl font-bold text-[#e87432]">
          Điểm: {score}
        </div>
        <div className="mt-4 flex justify-center gap-2">
          <ActionButton
            onClick={onNextLevel}
            icon={<RotateCcw size={16} />}
            label="Chơi tiếp"
            primary
          />
          <ActionButton
            onClick={onShowScores}
            icon={<Trophy size={16} />}
            label="Bảng điểm"
          />
        </div>
      </div>
    </div>
  );
}
