import { useState, useCallback } from "react";
import {
  createPairBoard,
  getBoardDimensions,
  getBoardSize,
  removeMatchedPair,
  getRemainingPairs,
  isBoardCleared,
  hasAnyMatch,
  shuffleRemaining,
  applyGravity,
  type PairTile,
  type Point,
} from "../utils/pairMatchLogic";
import { perfDiagnostics } from "../components/game/pixi/pixiPerfDiagnostics";
import { PIKACHU_CHARACTERS } from "../components/game/pixi/pikachuCharacterCatalog";

/** Used as a safe fallback before the atlas is ready (very first render). */
function _fallbackIds(): string[] {
  return PIKACHU_CHARACTERS.map((c) => c.id);
}

/** Empty optional catalogs must never override the runtime catalog. */
export function resolveCharacterIds(
  requestedIds: readonly string[] | undefined,
  configuredIds: readonly string[] = [],
): readonly string[] {
  if (requestedIds && requestedIds.length > 0) return requestedIds;
  if (configuredIds.length > 0) return configuredIds;
  return _fallbackIds();
}

export function useGameBoard(initialLevel: number = 1, characterIds: readonly string[] = []) {
  const [tiles, setTiles] = useState<PairTile[]>(() => {
    const { rows, cols } = getBoardSize(initialLevel);
    return createPairBoard(resolveCharacterIds(undefined, characterIds), rows, cols);
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [hintIds, setHintIds] = useState<string[]>([]);
  const [activePath, setActivePath] = useState<Point[] | null>(null);

  const { rows, cols } = getBoardDimensions(tiles, initialLevel);

  const resetBoard = useCallback((level: number, ids?: readonly string[]) => {
    const { rows: r, cols: c } = getBoardSize(level);
    setTiles(createPairBoard(resolveCharacterIds(ids, characterIds), r, c));
    setSelectedIds([]);
    setWrongIds([]);
    setHintIds([]);
    setActivePath(null);
  }, [characterIds]);

  const removePair = useCallback((firstId: string, secondId: string, level: number, rowsArg?: number, colsArg?: number) => {
    setTiles((prev) => {
      const removed = removeMatchedPair(prev, firstId, secondId);
      const dims = rowsArg && colsArg ? { rows: rowsArg, cols: colsArg } : getBoardDimensions(prev, level);
      return applyGravity(removed, level, dims.rows, dims.cols);
    });
  }, []);

  const shuffleIfNoMatch = useCallback((rowsArg?: number, colsArg?: number) => {
    perfDiagnostics.count("pikachu.autoShuffleChecks");
    const dims = rowsArg && colsArg ? { rows: rowsArg, cols: colsArg } : getBoardDimensions(tiles);
    if (isBoardCleared(tiles) || hasAnyMatch(tiles, dims.rows, dims.cols)) {
      return false;
    }

    setTiles((prev) => {
      return perfDiagnostics.measure("pikachu.autoShuffleCheck", () => {
        if (prev !== tiles && (isBoardCleared(prev) || hasAnyMatch(prev, dims.rows, dims.cols))) {
          return prev;
        }

        let nextBoard = shuffleRemaining(prev);
        let attempts = 0;
        while (!hasAnyMatch(nextBoard, dims.rows, dims.cols) && attempts < 50) {
          nextBoard = shuffleRemaining(nextBoard);
          attempts++;
        }
        perfDiagnostics.count("pikachu.autoShuffleAttempts", attempts + 1);
        return nextBoard;
      });
    });
    // ponytail: We passed the guard → shuffle was committed. Return true so
    // caller knows to not re-trigger the check on the same tick.
    return true;
  }, [tiles]);

  return {
    tiles,
    rows,
    cols,
    setTiles,
    selectedIds,
    setSelectedIds,
    wrongIds,
    setWrongIds,
    hintIds,
    setHintIds,
    activePath,
    setActivePath,
    resetBoard,
    removePair,
    shuffleIfNoMatch,
  };
}
