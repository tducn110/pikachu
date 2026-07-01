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
      className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl text-center z-40 bg-[#2a2418]/55 backdrop-blur-[12px] animate-[bolac-fade_0.25s]"
    >
      <div className="w-[85%] max-w-sm rounded-3xl px-6 py-8 bg-[#fdf6ea] border-2 border-[#f7b731] shadow-[0_14px_40px_rgba(42,36,24,0.3)] flex flex-col items-center">
        <Mascot className="w-16 h-16 md:w-20 md:h-20" />
        <h2 className="text-2xl md:text-3xl font-extrabold mt-4 text-[#2a2418]">
          Ghép xong rồi!
        </h2>
        <p className="text-[#8a7d65] mt-1 text-sm md:text-base">
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
