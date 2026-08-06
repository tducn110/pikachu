import { describe, it, expect } from "vitest";
import {
  createPairBoard,
  canMatch,
  getBoardSize,
  removeMatchedPair,
  getRemainingPairs,
  isBoardCleared,
  type PairTile,
  type TileKind,
} from "./pairMatchLogic";

describe("pairMatchLogic", () => {
  it("progresses through even square board sizes", () => {
    expect([1, 2, 3, 4, 5, 6].map((level) => getBoardSize(level).rows)).toEqual([8, 10, 12, 14, 16, 16]);
  });

  it("level one starts with a readable 8x8 board", () => {
    expect(createPairBoard(1)).toHaveLength(64);
  });

  it("level one has exactly 32 pairs", () => {
    expect(getRemainingPairs(createPairBoard(1))).toBe(32);
  });

  it("level one keeps every generated kind in complete pairs", () => {
    const counts = new Map<TileKind, number>();
    for (const tile of createPairBoard(1)) {
      counts.set(tile.kind, (counts.get(tile.kind) ?? 0) + 1);
    }
    for (const count of counts.values()) {
      expect(count % 2).toBe(0);
    }
  });

  const mk = (id: string, kind: TileKind, removed = false): PairTile => ({
    id,
    kind,
    row: 0,
    col: 0,
    removed,
  });

  it("same kind can match", () => {
    expect(canMatch([], mk("a", "cat"), mk("b", "cat"), 4, 4)).toBe(true);
  });

  it("different kind cannot match", () => {
    expect(canMatch([], mk("a", "cat"), mk("b", "dog"), 4, 4)).toBe(false);
  });

  it("a tile cannot match itself", () => {
    const t = mk("a", "cat");
    expect(canMatch([], t, t, 4, 4)).toBe(false);
  });

  it("removed tiles cannot match", () => {
    expect(canMatch([], mk("a", "cat"), mk("b", "cat", true), 4, 4)).toBe(false);
  });

  it("removed pair updates state", () => {
    const tiles = [mk("a", "cat"), mk("b", "cat"), mk("c", "dog")];
    const next = removeMatchedPair(tiles, "a", "b");
    expect(next.find((t) => t.id === "a")?.removed).toBe(true);
    expect(next.find((t) => t.id === "b")?.removed).toBe(true);
    expect(next.find((t) => t.id === "c")?.removed).toBe(false);
  });

  it("remaining pair count works", () => {
    let tiles = createPairBoard(1);
    expect(getRemainingPairs(tiles)).toBe(32);
    const [a, b] = tiles.filter((t) => t.kind === tiles[0].kind);
    tiles = removeMatchedPair(tiles, a.id, b.id);
    expect(getRemainingPairs(tiles)).toBe(31);
  });

  it("board cleared detection works", () => {
    let tiles = createPairBoard(1);
    expect(isBoardCleared(tiles)).toBe(false);
    tiles = tiles.map((t) => ({ ...t, removed: true }));
    expect(isBoardCleared(tiles)).toBe(true);
  });
});
