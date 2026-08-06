import { palette as c } from "./gameThemes";

interface StatProps {
  label: string;
  value: string | number;
  accent?: string;
}

function Stat({ label, value, accent = c.inkDark }: StatProps) {
  return (
    <div className="min-w-0 flex-1 rounded-xl border border-[#e4dccb] bg-white/60 px-2 py-2 text-center md:px-3">
      <div className="truncate text-[9px] font-bold uppercase tracking-widest text-[#69819b] md:text-[10px]">
        {label}
      </div>
      <div 
        className="text-base font-black leading-tight md:text-2xl"
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
    <div className="flex flex-col gap-2.5">
      {/* Time Bar */}
      <div 
        className="h-2.5 w-full overflow-hidden rounded-full border border-[#e0d7c7] bg-[#f0eadf]"
      >
        <div 
          className="h-full transition-all duration-300"
          style={{ 
            width: `${timePct}%`,
            backgroundColor: isDanger ? c.alertRed : c.orangeCta,
          }}
        />
      </div>

      <div className="flex gap-1.5 md:gap-2">
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
