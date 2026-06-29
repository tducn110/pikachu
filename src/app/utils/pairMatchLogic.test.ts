import { describe, it, expect } from "vitest";
import {
  createPairBoard,
  canMatch,
  canConnect,
  removeMatchedPair,
  getRemainingPairs,
  isBoardCleared,
  type PairTile,
  type TileKind,
} from "./pairMatchLogic";

describe("pairMatchLogic", () => {
  it("board has 16 tiles", () => {
    expect(createPairBoard(1)).toHaveLength(16);
  });

  it("board has exactly 8 pairs", () => {
    expect(getRemainingPairs(createPairBoard(1))).toBe(8);
  });

  it("each kind appears exactly twice", () => {
    const counts = new Map<TileKind, number>();
    for (const tile of createPairBoard(42)) {
      counts.set(tile.kind, (counts.get(tile.kind) ?? 0) + 1);
    }
    for (const count of counts.values()) {
      expect(count).toBe(2);
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
    expect(canMatch(mk("a", "cat"), mk("b", "cat"))).toBe(true);
  });

  it("different kind cannot match", () => {
    expect(canMatch(mk("a", "cat"), mk("b", "dog"))).toBe(false);
  });

  it("a tile cannot match itself", () => {
    const t = mk("a", "cat");
    expect(canMatch(t, t)).toBe(false);
  });

  it("removed tiles cannot match", () => {
    expect(canMatch(mk("a", "cat"), mk("b", "cat", true))).toBe(false);
  });

  it("removed pair updates state", () => {
    const tiles = [mk("a", "cat"), mk("b", "cat"), mk("c", "dog")];
    const next = removeMatchedPair(tiles, "a", "b");
    expect(next.find((t) => t.id === "a")?.removed).toBe(true);
    expect(next.find((t) => t.id === "b")?.removed).toBe(true);
    expect(next.find((t) => t.id === "c")?.removed).toBe(false);
  });

  it("remaining pair count works", () => {
    let tiles = createPairBoard(7);
    expect(getRemainingPairs(tiles)).toBe(8);
    const [a, b] = tiles.filter((t) => t.kind === tiles[0].kind);
    tiles = removeMatchedPair(tiles, a.id, b.id);
    expect(getRemainingPairs(tiles)).toBe(7);
  });

  // --- connectivity (Onet) rules ---

  // Build a custom board where every tile is removed except the ones provided.
  const boardWith = (placed: PairTile[]): PairTile[] => {
    const base = createPairBoard(1).map((t) => ({ ...t, removed: true }));
    for (const p of placed) {
      const slot = base.find((t) => t.row === p.row && t.col === p.col)!;
      slot.kind = p.kind;
      slot.removed = false;
      p.id = slot.id;
    }
    return base;
  };

  it("adjacent same tiles can connect (straight line)", () => {
    const a: PairTile = { id: "a", kind: "cat", row: 0, col: 0, removed: false };
    const b: PairTile = { id: "b", kind: "cat", row: 0, col: 1, removed: false };
    const board = boardWith([a, b]);
    expect(canConnect(board, a.id, b.id)).toBe(true);
  });

  it("same tiles with a clear L-path can connect", () => {
    const a: PairTile = { id: "a", kind: "cat", row: 0, col: 0, removed: false };
    const b: PairTile = { id: "b", kind: "cat", row: 3, col: 3, removed: false };
    const board = boardWith([a, b]);
    expect(canConnect(board, a.id, b.id)).toBe(true);
  });

  it("same tiles fully blocked cannot connect", () => {
    // Surround tile a so no path (even via border) reaches b across a wall.
    const a: PairTile = { id: "a", kind: "cat", row: 1, col: 1, removed: false };
    const b: PairTile = { id: "b", kind: "cat", row: 1, col: 3, removed: false };
    const walls: PairTile[] = [
      { id: "w1", kind: "dog", row: 0, col: 1, removed: false },
      { id: "w2", kind: "dog", row: 2, col: 1, removed: false },
      { id: "w3", kind: "dog", row: 1, col: 2, removed: false },
      { id: "w4", kind: "dog", row: 0, col: 2, removed: false },
      { id: "w5", kind: "dog", row: 2, col: 2, removed: false },
    ];
    const board = boardWith([a, b, ...walls]);
    expect(canConnect(board, a.id, b.id)).toBe(false);
  });

  it("different kinds never connect", () => {
    const a: PairTile = { id: "a", kind: "cat", row: 0, col: 0, removed: false };
    const b: PairTile = { id: "b", kind: "dog", row: 0, col: 1, removed: false };
    const board = boardWith([a, b]);
    expect(canConnect(board, a.id, b.id)).toBe(false);
  });

  it("board cleared detection works", () => {
    let tiles = createPairBoard(9);
    expect(isBoardCleared(tiles)).toBe(false);
    tiles = tiles.map((t) => ({ ...t, removed: true }));
    expect(isBoardCleared(tiles)).toBe(true);
  });
});
