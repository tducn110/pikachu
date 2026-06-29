import type { PairTile } from "../../utils/pairMatchLogic";
import { PairTileIcon } from "./PairTileIcon";
import { KIND_LABELS, palette as c } from "./gameThemes";

interface Props {
  tiles: PairTile[];
  selectedIds: string[];
  wrongIds: string[];
  hintIds: string[];
  onSelect: (id: string) => void;
}

export function GameBoard({
  tiles,
  selectedIds,
  wrongIds,
  hintIds,
  onSelect,
}: Props) {
  return (
    <div
      role="group"
      aria-label="Bàn chơi Ghép Đôi Bộ Lạc"
      className="grid grid-cols-4 gap-2 aspect-square w-full"
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
          <button
            key={tile.id}
            type="button"
            onClick={() => onSelect(tile.id)}
            disabled={tile.removed}
            aria-label={
              tile.removed
                ? "Ô trống"
                : `${KIND_LABELS[tile.kind]}${isSelected ? ", đang chọn" : ""}`
            }
            className="relative flex items-center justify-center rounded-2xl transition-all duration-200 min-h-[44px]"
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
              <PairTileIcon kind={tile.kind} size={48} />
            )}
          </button>
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
  );
}
