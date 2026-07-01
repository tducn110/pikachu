import { palette as c } from "./gameThemes";

interface StatProps {
  label: string;
  value: string | number;
  accent?: string;
}

function Stat({ label, value, accent = c.inkDark }: StatProps) {
  return (
    <div className="flex-1 rounded-2xl px-2 md:px-3 py-2 text-center bg-white/85 border-[1.5px] border-[#8a7d65]/30">
      <div className="text-[9px] md:text-[11px] font-bold tracking-widest uppercase text-[#8a7d65]">
        {label}
      </div>
      <div 
        className="text-lg md:text-2xl font-extrabold leading-tight"
        style={{ color: accent }}
      >
        {value}
      </div>
    </div>
  );
}

interface Props {
  score: number;
  level: number;
  moves: number;
  remainingPairs: number;
  combo: number;
  timeLeft: number;
  maxTime: number;
}

export function GameHUD({ score, level, moves, remainingPairs, combo, timeLeft, maxTime }: Props) {
  const timePct = Math.max(0, Math.min(100, (timeLeft / maxTime) * 100));
  const isDanger = timePct < 25;

  return (
    <div className="flex flex-col gap-3">
      {/* Time Bar */}
      <div 
        className="w-full h-3 rounded-full bg-white/50 border border-[#8a7d65]/30 overflow-hidden"
      >
        <div 
          className="h-full transition-all duration-300"
          style={{ 
            width: `${timePct}%`,
            backgroundColor: isDanger ? c.alertRed : c.bambooGreen,
          }}
        />
      </div>

      <div className="flex gap-2">
        <Stat label="Cấp độ" value={level} accent={c.mascotYellow} />
        <Stat label="Điểm" value={score} accent={c.orangeCta} />
        <Stat label="Cặp" value={remainingPairs} accent={c.bambooGreen} />
        <Stat
          label="Combo"
          value={combo > 0 ? `×${combo}` : "—"}
          accent={combo > 0 ? c.alertRed : c.inkDark}
        />
      </div>
    </div>
  );
}
