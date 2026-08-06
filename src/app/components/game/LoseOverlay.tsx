import React from "react";
import { RotateCcw } from "lucide-react";
import { Mascot } from "./Mascot";
import { ActionButton } from "./ActionButton";
import { palette as c } from "./gameThemes";

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
      className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 rounded-2xl bg-[#18324f]/35 text-center backdrop-blur-[12px] animate-[bolac-fade_0.25s]"
    >
      <div className="flex w-[85%] max-w-sm flex-col items-center rounded-3xl border-2 border-[#ff8b8b] bg-white px-6 py-8 shadow-[0_14px_40px_rgba(51,104,145,0.24)]">
        <div className="grayscale opacity-80 flex justify-center mb-2">
          <Mascot className="w-16 h-16 md:w-20 md:h-20" />
        </div>
        <h2 className="mt-4 text-2xl font-black text-[#18324f] md:text-3xl">
          Hết thời gian!
        </h2>
        <p className="mt-1 text-sm text-[#69819b] md:text-base">
          Bạn chưa kịp tìm hết các cặp
        </p>
        <div className="mt-3 text-lg md:text-xl font-bold text-[#e87432]">
          Điểm: {score}
        </div>
        <div className="mt-4 flex justify-center gap-2">
          <ActionButton
            onClick={onPlayAgain}
            icon={<RotateCcw size={16} />}
            label="Chơi lại"
            primary
          />
        </div>
      </div>
    </div>
  );
}
