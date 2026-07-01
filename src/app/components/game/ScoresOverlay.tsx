import React from "react";
import { Overlay } from "./Overlay";
import { palette as c } from "./gameThemes";
import type { ScoreStats } from "../../utils/stats";

function ScoreRow({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl px-4 py-3 bg-white/70 border-[1.5px] border-[#8a7d65]/30">
      <span className="font-semibold text-[#8a7d65] text-sm md:text-base">{label}</span>
      <span className="font-extrabold text-xl md:text-2xl" style={{ color: accent }}>{value}</span>
    </div>
  );
}

export function ScoresOverlay({
  onClose,
  stats,
}: {
  onClose: () => void;
  stats: ScoreStats;
}) {
  return (
    <Overlay onClose={onClose} title="Bảng điểm">
      <ScoreRow label="Điểm cao nhất" value={stats.best} accent={c.mascotYellow} />
      <ScoreRow label="Điểm gần nhất" value={stats.last} accent={c.orangeCta} />
      <ScoreRow label="Số ván đã chơi" value={stats.totalGames} accent={c.bambooGreen} />
    </Overlay>
  );
}
