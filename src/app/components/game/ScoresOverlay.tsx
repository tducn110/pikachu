import React from "react";
import { Overlay } from "./Overlay";
import type { ScoreStats } from "../../utils/stats";
import { HyperIcon } from "./hyperUi";

function ScoreRow({ label, value, accent, icon }: { label: string; value: number; accent: string; icon: "trophy" | "clock" | "heart" }) {
  return (
    <div className="hyper-score-row">
      <HyperIcon name={icon} className="h-10 w-10 object-contain" />
      <span className="hyper-score-label">{label}</span>
      <span className="hyper-score-value" style={{ color: accent }}>{value}</span>
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
      <ScoreRow label="Điểm cao nhất" value={stats.best} accent="#f4771a" icon="trophy" />
      <ScoreRow label="Điểm gần nhất" value={stats.last} accent="#7227b8" icon="clock" />
      <ScoreRow label="Số ván đã chơi" value={stats.totalGames} accent="#25a56a" icon="heart" />
    </Overlay>
  );
}
