import { palette as c } from "./gameThemes";

interface StatProps {
  label: string;
  value: string | number;
  accent?: string;
}

function Stat({ label, value, accent = c.inkDark }: StatProps) {
  return (
    <div
      className="flex-1 rounded-2xl px-3 py-2 text-center"
      style={{
        background: "rgba(255,255,255,0.85)",
        border: `1.5px solid rgba(138,125,101,0.3)`,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: c.pencilGray,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: accent, lineHeight: 1.2 }}>
        {value}
      </div>
    </div>
  );
}

interface Props {
  score: number;
  moves: number;
  remainingPairs: number;
  combo: number;
}

export function GameHUD({ score, moves, remainingPairs, combo }: Props) {
  return (
    <div className="flex gap-2">
      <Stat label="Điểm" value={score} accent={c.orangeCta} />
      <Stat label="Lượt" value={moves} />
      <Stat label="Cặp còn lại" value={remainingPairs} accent={c.bambooGreen} />
      <Stat
        label="Combo"
        value={combo > 0 ? `×${combo}` : "—"}
        accent={combo > 0 ? c.alertRed : c.inkDark}
      />
    </div>
  );
}
