import { useState, useCallback } from "react";
import {
  createPairBoard,
  removeMatchedPair,
  getRemainingPairs,
  isBoardCleared,
  hasAnyMatch,
  shuffleRemaining,
  applyGravity,
  type PairTile,
  type Point,
} from "../utils/pairMatchLogic";

export function useGameBoard(initialLevel: number = 1) {
  const [tiles, setTiles] = useState<PairTile[]>(() => createPairBoard(initialLevel));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [hintIds, setHintIds] = useState<string[]>([]);
  const [activePath, setActivePath] = useState<Point[] | null>(null);

  const resetBoard = useCallback((level: number) => {
    setTiles(createPairBoard(level));
    setSelectedIds([]);
    setWrongIds([]);
    setHintIds([]);
    setActivePath(null);
  }, []);

  const removePair = useCallback((firstId: string, secondId: string, level: number, rows: number, cols: number) => {
    setTiles((prev) => {
      const removed = removeMatchedPair(prev, firstId, secondId);
      return applyGravity(removed, level, rows, cols);
    });
  }, []);

  const shuffleIfNoMatch = useCallback((rows: number, cols: number) => {
    let changed = false;
    setTiles((prev) => {
      if (isBoardCleared(prev) || hasAnyMatch(prev, rows, cols)) {
        return prev;
      }
      
      let nextBoard = shuffleRemaining(prev);
      changed = true;
      let attempts = 0;
      while (!hasAnyMatch(nextBoard, rows, cols) && attempts < 50) {
        nextBoard = shuffleRemaining(nextBoard);
        attempts++;
      }
      return nextBoard;
    });
    return changed;
  }, []);

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
