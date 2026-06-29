import { palette as c } from "./gameThemes";

interface Props {
  size?: number;
}

/** Lạc Lạc — the peanut mascot, drawn procedurally per DESIGN.md §5.5. */
export function Mascot({ size = 72 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <defs>
        <radialGradient id="mascotGround" cx="50%" cy="30%" r="80%">
          <stop offset="0%" stopColor={c.bambooSoft} />
          <stop offset="100%" stopColor={c.bambooGreen} />
        </radialGradient>
      </defs>
      <circle cx="40" cy="40" r="38" fill="url(#mascotGround)" stroke={c.inkDark} strokeWidth="2.5" />
      {/* body: double oval peanut */}
      <path
        d="M40 14c9 0 13 6 13 13 0 4-2 6-2 9s2 5 2 9c0 8-5 13-13 13s-13-5-13-13c0-4 2-6 2-9s-2-5-2-9c0-7 4-13 13-13Z"
        fill={c.mascotYellow}
        stroke={c.inkDark}
        strokeWidth="2.5"
      />
      <path d="M29 36c7 3 15 3 22 0" stroke={c.earthBrown} strokeWidth="2.5" />
      <circle cx="35" cy="30" r="2" fill={c.inkDark} />
      <circle cx="45" cy="30" r="2" fill={c.inkDark} />
      <circle cx="32" cy="34" r="2.4" fill={c.orangeCta} opacity="0.55" />
      <circle cx="48" cy="34" r="2.4" fill={c.orangeCta} opacity="0.55" />
      <path d="M36 35q4 3 8 0" stroke={c.inkDark} strokeWidth="2" fill="none" />
    </svg>
  );
}
