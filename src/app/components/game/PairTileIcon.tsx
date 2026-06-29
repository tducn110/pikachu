import type { TileKind } from "../../utils/pairMatchLogic";
import { palette as c } from "./gameThemes";

interface Props {
  kind: TileKind;
  size?: number;
}

/** Original, procedurally-drawn SVG icons in the warm countryside palette. */
export function PairTileIcon({ kind, size = 56 }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 64 64",
    fill: "none" as const,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (kind) {
    case "peanut":
      return (
        <svg {...common}>
          <path
            d="M32 6c8 0 12 6 12 13 0 4-2 7-2 10s2 6 2 10c0 8-5 13-12 13s-12-5-12-13c0-4 2-7 2-10s-2-6-2-10C20 12 24 6 32 6Z"
            fill={c.mascotYellow}
            stroke={c.inkDark}
            strokeWidth="2.5"
          />
          <path d="M21 30c7 3 15 3 22 0" stroke={c.earthBrown} strokeWidth="2.5" />
          <path d="M22 22c6 2 14 2 20 0" stroke={c.earthBrown} strokeWidth="2" />
          <path d="M22 39c6 2 14 2 20 0" stroke={c.earthBrown} strokeWidth="2" />
          <circle cx="28" cy="42" r="1.6" fill={c.inkDark} />
          <circle cx="36" cy="42" r="1.6" fill={c.inkDark} />
          <path d="M29 47c2 1.5 4 1.5 6 0" stroke={c.inkDark} strokeWidth="2" />
        </svg>
      );
    case "cat":
      return (
        <svg {...common}>
          <path d="M16 20 12 8l12 6" fill={c.orangeCta} stroke={c.inkDark} strokeWidth="2.5" />
          <path d="M48 20 52 8 40 14" fill={c.orangeCta} stroke={c.inkDark} strokeWidth="2.5" />
          <circle cx="32" cy="36" r="20" fill={c.orangeCta} stroke={c.inkDark} strokeWidth="2.5" />
          <path d="M14 34h10M40 34h10" stroke={c.earthBrown} strokeWidth="1.6" />
          <circle cx="25" cy="34" r="2.2" fill={c.inkDark} />
          <circle cx="39" cy="34" r="2.2" fill={c.inkDark} />
          <path d="M30 41h4l-2 3z" fill={c.alertRed} stroke={c.inkDark} strokeWidth="1.5" />
          <path d="M20 44q6 5 12 0M44 44q-6 5-12 0" stroke={c.inkDark} strokeWidth="1.6" />
        </svg>
      );
    case "dog":
      return (
        <svg {...common}>
          <path d="M14 16q-6 4-4 16 6 2 9-2z" fill={c.earthBrown} stroke={c.inkDark} strokeWidth="2.5" />
          <path d="M50 16q6 4 4 16-6 2-9-2z" fill={c.earthBrown} stroke={c.inkDark} strokeWidth="2.5" />
          <circle cx="32" cy="36" r="19" fill={c.mascotYellow} stroke={c.inkDark} strokeWidth="2.5" />
          <circle cx="25" cy="34" r="2.4" fill={c.inkDark} />
          <circle cx="39" cy="34" r="2.4" fill={c.inkDark} />
          <ellipse cx="32" cy="42" rx="4" ry="3" fill={c.inkDark} />
          <path d="M32 45v4M27 49q5 3 10 0" stroke={c.inkDark} strokeWidth="2" />
        </svg>
      );
    case "bamboo":
      return (
        <svg {...common}>
          <rect x="26" y="8" width="12" height="48" rx="4" fill={c.bambooGreen} stroke={c.inkDark} strokeWidth="2.5" />
          <path d="M26 22h12M26 36h12M26 50h12" stroke={c.leafDeep} strokeWidth="2.5" />
          <path d="M38 18q12-4 16-12-10 0-16 6" fill={c.bambooSoft} stroke={c.inkDark} strokeWidth="2" />
          <path d="M26 30q-12-2-18 4 8 4 18-1" fill={c.bambooSoft} stroke={c.inkDark} strokeWidth="2" />
        </svg>
      );
    case "kite":
      return (
        <svg {...common}>
          <path d="M32 6 50 28 32 50 14 28Z" fill={c.orangeCta} stroke={c.inkDark} strokeWidth="2.5" />
          <path d="M32 6v44M14 28h36" stroke={c.inkDark} strokeWidth="1.6" />
          <path d="M32 50q3 6-2 10 7-1 8-6" stroke={c.earthBrown} strokeWidth="2" fill="none" />
          <path d="M30 52l5 3-5 3 5 3" stroke={c.mascotYellow} strokeWidth="2.5" fill="none" />
        </svg>
      );
    case "stork":
      return (
        <svg {...common}>
          <ellipse cx="30" cy="38" rx="16" ry="11" fill="#ffffff" stroke={c.inkDark} strokeWidth="2.5" />
          <path d="M40 30q8-10 14-12-2 8-8 14" fill="#ffffff" stroke={c.inkDark} strokeWidth="2.5" />
          <circle cx="46" cy="22" r="6" fill="#ffffff" stroke={c.inkDark} strokeWidth="2.5" />
          <circle cx="47" cy="21" r="1.6" fill={c.inkDark} />
          <path d="M52 22 62 20l-9 5z" fill={c.orangeCta} stroke={c.inkDark} strokeWidth="2" />
          <path d="M26 49v8M34 49v8" stroke={c.earthBrown} strokeWidth="2.5" />
        </svg>
      );
    case "rice":
      return (
        <svg {...common}>
          <path d="M22 56q-2-26 4-44M42 56q2-26-4-44M32 56V12" stroke={c.bambooGreen} strokeWidth="2.5" fill="none" />
          {[16, 24, 32].map((y) => (
            <g key={y}>
              <ellipse cx="26" cy={y} rx="3.5" ry="6" fill={c.mascotYellow} stroke={c.inkDark} strokeWidth="1.6" transform={`rotate(-18 26 ${y})`} />
              <ellipse cx="38" cy={y} rx="3.5" ry="6" fill={c.mascotYellow} stroke={c.inkDark} strokeWidth="1.6" transform={`rotate(18 38 ${y})`} />
            </g>
          ))}
          <ellipse cx="32" cy="10" rx="3.5" ry="6" fill={c.mascotYellow} stroke={c.inkDark} strokeWidth="1.6" />
        </svg>
      );
    case "drum":
      return (
        <svg {...common}>
          <ellipse cx="32" cy="18" rx="20" ry="7" fill={c.creamCard} stroke={c.inkDark} strokeWidth="2.5" />
          <path d="M12 18v22a20 7 0 0 0 40 0V18" fill={c.alertRed} stroke={c.inkDark} strokeWidth="2.5" />
          <path d="M12 30a20 7 0 0 0 40 0" stroke={c.inkDark} strokeWidth="1.6" fill="none" />
          <path d="M16 22 48 36M48 22 16 36" stroke={c.mascotYellow} strokeWidth="2" />
          <path d="M50 8 58 4M50 14 60 14" stroke={c.earthBrown} strokeWidth="2.5" />
        </svg>
      );
  }
}
