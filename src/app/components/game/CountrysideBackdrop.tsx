import { palette as c } from "./gameThemes";

/** Hand-drawn SVG countryside backdrop (DESIGN.md §6). No raster assets. */
export function CountrysideBackdrop() {
  return (
    <svg
      className="absolute inset-0 size-full"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <rect width="1200" height="800" fill={c.ricePaper} />
      {/* far mountains */}
      <path
        d="M0 360 Q200 250 380 330 T760 320 T1200 350 V800 H0Z"
        fill="#e6d8b2"
        opacity="0.6"
        stroke={c.pencilGray}
        strokeWidth="1"
        strokeOpacity="0.3"
      />
      {/* mid field */}
      <path
        d="M0 470 Q300 410 600 470 T1200 460 V800 H0Z"
        fill={c.bambooSoft}
        opacity="0.5"
      />
      {/* storks */}
      {[
        [180, 160],
        [240, 140],
        [300, 175],
        [900, 130],
        [960, 155],
      ].map(([x, y], i) => (
        <path
          key={i}
          d={`M${x} ${y} q10 -8 20 0 q10 -8 20 0`}
          stroke={c.pencilGray}
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          opacity="0.55"
        />
      ))}
      {/* bamboo / palm strokes */}
      {Array.from({ length: 14 }).map((_, i) => {
        const x = 60 + i * 82;
        return (
          <path
            key={i}
            d={`M${x} 500 q-4 -90 6 -150`}
            stroke={c.bambooGreen}
            strokeWidth="1.2"
            strokeOpacity="0.45"
            fill="none"
            strokeLinecap="round"
          />
        );
      })}
      {/* foreground grass gradient */}
      <defs>
        <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c.bambooSoft} />
          <stop offset="100%" stopColor={c.leafDeep} />
        </linearGradient>
      </defs>
      <path d="M0 600 Q300 560 600 600 T1200 590 V800 H0Z" fill="url(#grass)" opacity="0.85" />
      {/* a little kite */}
      <g opacity="0.7">
        <path d="M1040 220 l28 34 -28 34 -28 -34Z" fill={c.orangeCta} stroke={c.inkDark} strokeWidth="1.5" />
        <path d="M1012 288 q-10 30 6 50" stroke={c.mascotYellow} strokeWidth="1.5" fill="none" />
      </g>
    </svg>
  );
}
