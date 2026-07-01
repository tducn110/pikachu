import { getBoardSize, type PairTile, type Point } from "../../utils/pairMatchLogic";
import { PairTileIcon } from "./PairTileIcon";
import { KIND_LABELS, palette as c } from "./gameThemes";

interface Props {
  tiles: PairTile[];
  selectedIds: string[];
  wrongIds: string[];
  hintIds: string[];
  activePath: Point[] | null;
  onSelect: (id: string) => void;
  level: number;
}

export function GameBoard({
  tiles,
  selectedIds,
  wrongIds,
  hintIds,
  activePath,
  onSelect,
  level,
}: Props) {
  const { rows, cols } = getBoardSize(level);

  // Convert points to percentage coordinates dynamically
  const getPointCoords = (p: Point) => {
    const pctX = 100 / cols;
    const pctY = 100 / rows;
    return `${(p.c + 0.5) * pctX}% ${(p.r + 0.5) * pctY}%`;
  };

  const pathString = activePath ? activePath.map(getPointCoords).join(", ") : "";

  return (
    <div className="relative w-full" style={{ aspectRatio: `${cols}/${rows}` }}>
      <div
        role="group"
        aria-label="Bàn chơi Ghép Đôi Bộ Lạc"
        className="w-full h-full relative z-10"
      >
      {tiles.map((tile) => {
        const isSelected = selectedIds.includes(tile.id);
        const isWrong = wrongIds.includes(tile.id);
        const isHint = hintIds.includes(tile.id);

        let border = `1.5px solid rgba(138,125,101,0.45)`;
        if (isSelected) border = `3px solid ${c.orangeCta}`;
        else if (isWrong) border = `3px solid ${c.alertRed}`;
        else if (isHint) border = `3px dashed ${c.bambooGreen}`;

        return (
          <div
            key={tile.id}
            className="absolute p-1 transition-all duration-300 ease-out"
            style={{
              left: `${(tile.col * 100) / cols}%`,
              top: `${(tile.row * 100) / rows}%`,
              width: `${100 / cols}%`,
              height: `${100 / rows}%`,
              zIndex: tile.removed ? 0 : 10,
            }}
          >
            <button
              type="button"
              onClick={() => onSelect(tile.id)}
              disabled={tile.removed}
              aria-label={
                tile.removed
                  ? "Ô trống"
                  : `${KIND_LABELS[tile.kind]}${isSelected ? ", đang chọn" : ""}`
              }
              className="relative flex items-center justify-center w-full h-full rounded-2xl transition-all duration-200"
              style={{
                background: tile.removed ? "transparent" : c.creamCard,
                border: tile.removed ? `1.5px dashed rgba(138,125,101,0.2)` : border,
                boxShadow: tile.removed
                  ? "none"
                  : isSelected
                  ? `0 8px 20px rgba(232,116,50,0.35)`
                  : `0 6px 16px rgba(42,36,24,0.08)`,
                opacity: tile.removed ? 0 : 1,
                transform: tile.removed
                  ? "scale(0.6)"
                  : isSelected
                  ? "scale(1.05)"
                  : "scale(1)",
                pointerEvents: tile.removed ? "none" : "auto",
                animation: isWrong ? "bolac-shake 0.4s" : undefined,
              }}
            >
              {!tile.removed && (
                <div className="w-[70%] h-[70%] max-w-[56px] max-h-[56px]">
                  <PairTileIcon kind={tile.kind} />
                </div>
              )}
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes bolac-shake {
          0%,100% { transform: translateX(0) scale(1); }
          20% { transform: translateX(-4px) scale(1); }
          40% { transform: translateX(4px) scale(1); }
          60% { transform: translateX(-3px) scale(1); }
          80% { transform: translateX(3px) scale(1); }
        }
      `}</style>
      </div>

      {/* SVG Path Overlay */}
      {activePath && activePath.length > 1 && (
        <svg
          className="absolute inset-0 pointer-events-none z-20"
          style={{ width: "100%", height: "100%", overflow: "visible" }}
        >
          {activePath.slice(0, -1).map((p, i) => {
            const next = activePath[i + 1];
            return (
              <line
                key={`line-${i}`}
                x1={`${(p.c + 0.5) * (100 / cols)}%`}
                y1={`${(p.r + 0.5) * (100 / rows)}%`}
                x2={`${(next.c + 0.5) * (100 / cols)}%`}
                y2={`${(next.r + 0.5) * (100 / rows)}%`}
                stroke={c.orangeCta}
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-pulse"
                style={{
                  filter: "drop-shadow(0px 2px 4px rgba(232,116,50,0.5))"
                }}
              />
            );
          })}
          {/* Optional: Draw circles at joints/endpoints */}
          {activePath.map((p, i) => (
            <circle
              key={`circle-${i}`}
              cx={`${(p.c + 0.5) * (100 / cols)}%`}
              cy={`${(p.r + 0.5) * (100 / rows)}%`}
              r="5"
              fill="#fff"
              stroke={c.orangeCta}
              strokeWidth="3"
              style={{
                filter: "drop-shadow(0px 2px 4px rgba(232,116,50,0.5))"
              }}
            />
          ))}
        </svg>
      )}
    </div>
  );
}
