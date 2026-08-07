import { useState, useCallback } from "react";
import {
  createPairBoard,
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

  const resetBoard = useCallback((level: number, ids?: readonly string[]) => {
    const { rows, cols } = getBoardSize(level);
    setTiles(createPairBoard(resolveCharacterIds(ids, characterIds), rows, cols));
    setSelectedIds([]);
    setWrongIds([]);
    setHintIds([]);
    setActivePath(null);
  }, [characterIds]);

  const removePair = useCallback((firstId: string, secondId: string, level: number, rows: number, cols: number) => {
    setTiles((prev) => {
      const removed = removeMatchedPair(prev, firstId, secondId);
      return applyGravity(removed, level, rows, cols);
    });
  }, []);

  const shuffleIfNoMatch = useCallback((rows: number, cols: number) => {
    perfDiagnostics.count("pikachu.autoShuffleChecks");
    if (isBoardCleared(tiles) || hasAnyMatch(tiles, rows, cols)) {
      return false;
    }

    let changed = false;
    setTiles((prev) => {
      return perfDiagnostics.measure("pikachu.autoShuffleCheck", () => {
        if (prev !== tiles && (isBoardCleared(prev) || hasAnyMatch(prev, rows, cols))) {
          return prev;
        }

        let nextBoard = shuffleRemaining(prev);
        changed = true;
        let attempts = 0;
        while (!hasAnyMatch(nextBoard, rows, cols) && attempts < 50) {
          nextBoard = shuffleRemaining(nextBoard);
          attempts++;
        }
        perfDiagnostics.count("pikachu.autoShuffleAttempts", attempts + 1);
        return nextBoard;
      });
    });
    changed = true;
    return changed;
  }, [tiles]);

  return {
    tiles,
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
