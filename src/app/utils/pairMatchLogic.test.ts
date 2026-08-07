import { describe, it, expect } from "vitest";
import {
  createPairBoard,
  canMatch,
  evaluatePairMatch,
  findPikachuPath,
  getBoardSize,
  applyGravity,
  removeMatchedPair,
  getRemainingPairs,
  isBoardCleared,
  mulberry32,
  type PairTile,
} from "./pairMatchLogic";

// ── Test catalog ──────────────────────────────────────────────────────────────
// Use 20 synthetic IDs that mirror the real catalog structure.
const CATALOG_20 = Array.from({ length: 20 }, (_, i) =>
  i < 10 ? `legacy:${String(i + 1).padStart(2, "0")}` : `new:${i + 25}`,
);

const rng = mulberry32(42);

// Helper to build a board with explicit dimensions for test clarity
function board(ids: readonly string[], rows: number, cols: number, seed = 1) {
  return createPairBoard(ids, rows, cols, seed);
}

// ── Board size progression ────────────────────────────────────────────────────
describe("getBoardSize", () => {
  it("level 1 starts at 8×8", () => {
    expect(getBoardSize(1)).toEqual({ rows: 8, cols: 8 });
  });

  it("progresses through 8,10,12,14,16 and caps at the final challenge", () => {
    expect([1, 2, 3, 4, 5, 6].map((l) => getBoardSize(l).rows)).toEqual([8, 10, 12, 14, 16, 16]);
  });
});

// ── createPairBoard invariants ────────────────────────────────────────────────
describe("createPairBoard", () => {
  it("8×8 → 64 tiles", () => {
    expect(board(CATALOG_20, 8, 8)).toHaveLength(64);
  });

  it("16×16 → 256 tiles", () => {
    expect(board(CATALOG_20, 16, 16)).toHaveLength(256);
  });

  it("every kind count is even (each tile has a pair)", () => {
    const tiles = board(CATALOG_20, 8, 8);
    const counts = new Map<string, number>();
    for (const t of tiles) counts.set(t.kind, (counts.get(t.kind) ?? 0) + 1);
    for (const [, count] of counts) expect(count % 2).toBe(0);
  });

  it("8×8 with 20-catalog uses all 20 active kinds", () => {
    const tiles = board(CATALOG_20, 8, 8);
    const kinds = new Set(tiles.map((t) => t.kind));
    expect(kinds.size).toBe(20);
  });

  it("each active kind appears at least 2 tiles (≥1 pair)", () => {
    const tiles = board(CATALOG_20, 8, 8);
    const counts = new Map<string, number>();
    for (const t of tiles) counts.set(t.kind, (counts.get(t.kind) ?? 0) + 1);
    for (const [, count] of counts) expect(count).toBeGreaterThanOrEqual(2);
  });

  it("balanced distribution: max pair diff ≤ 1 (8×8 / 20 catalog)", () => {
    const tiles = board(CATALOG_20, 8, 8);
    const counts = new Map<string, number>();
    for (const t of tiles) counts.set(t.kind, (counts.get(t.kind) ?? 0) + 1);
    const pairs = [...counts.values()].map((c) => c / 2);
    const min = Math.min(...pairs);
    const max = Math.max(...pairs);
    expect(max - min).toBeLessThanOrEqual(1);
  });

  it("balanced distribution: max pair diff ≤ 1 (16×16 / 20 catalog)", () => {
    const tiles = board(CATALOG_20, 16, 16);
    const counts = new Map<string, number>();
    for (const t of tiles) counts.set(t.kind, (counts.get(t.kind) ?? 0) + 1);
    const pairs = [...counts.values()].map((c) => c / 2);
    const min = Math.min(...pairs);
    const max = Math.max(...pairs);
    expect(max - min).toBeLessThanOrEqual(1);
  });

  it("16×16 / 20 catalog: base=6 extra=8 → 8 kinds×7pairs + 12 kinds×6pairs", () => {
    const tiles = board(CATALOG_20, 16, 16);
    const counts = new Map<string, number>();
    for (const t of tiles) counts.set(t.kind, (counts.get(t.kind) ?? 0) + 1);
    const pairs = [...counts.values()].map((c) => c / 2);
    const sevenPairs = pairs.filter((p) => p === 7).length;
    const sixPairs = pairs.filter((p) => p === 6).length;
    expect(sevenPairs).toBe(8);
    expect(sixPairs).toBe(12);
  });

  it("all tile IDs are unique", () => {
    const tiles = board(CATALOG_20, 8, 8);
    const ids = tiles.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("total pair count is correct for 8×8", () => {
    const tiles = board(CATALOG_20, 8, 8);
    expect(getRemainingPairs(tiles)).toBe(32);
  });

  it("smaller catalog than pairCount → uses all catalog items", () => {
    const small = ["A", "B", "C"]; // 3 chars, 2×2 needs 2 pairs → 2 active
    const tiles = board(small, 2, 2);
    expect(tiles).toHaveLength(4);
    const kinds = new Set(tiles.map((t) => t.kind));
    expect(kinds.size).toBe(2); // min(2, 3) = 2
  });

  it("legacy level-based overload still works (board length)", () => {
    // Level 1 → 8×8 = 64 tiles
    const tiles = createPairBoard(1);
    expect(tiles).toHaveLength(64);
  });
});

// ── Game logic (unchanged) ────────────────────────────────────────────────────
describe("matching rules", () => {
  const mk = (id: string, kind: string, removed = false): PairTile => ({
    id, kind, row: 0, col: 0, removed,
  });

  it("same kind can match", () => {
    expect(canMatch([], mk("a", "legacy:01"), mk("b", "legacy:01"), 4, 4)).toBe(true);
  });

  it("different kind cannot match", () => {
    expect(canMatch([], mk("a", "legacy:01"), mk("b", "new:035"), 4, 4)).toBe(false);
  });

  it("a tile cannot match itself", () => {
    const t = mk("a", "legacy:01");
    expect(canMatch([], t, t, 4, 4)).toBe(false);
  });

  it("removed tiles cannot match", () => {
    expect(canMatch([], mk("a", "legacy:01"), mk("b", "legacy:01", true), 4, 4)).toBe(false);
  });
});

function placed(entries: Array<[string, string, number, number]>): PairTile[] {
  return entries.map(([id, kind, row, col]) => ({ id, kind, row, col, removed: false }));
}

describe("Pikachu routing and result reasons", () => {
  const pathFor = (tiles: PairTile[], first = "a", second = "b", rows = 3, cols = 3) =>
    findPikachuPath(tiles, tiles.find((tile) => tile.id === first)!, tiles.find((tile) => tile.id === second)!, rows, cols);

  it("allows a clear same-row route with zero corners", () => {
    const tiles = placed([["a", "A", 1, 0], ["b", "A", 1, 2]]);
    expect(pathFor(tiles)).toEqual([{ r: 1, c: 0 }, { r: 1, c: 2 }]);
  });

  it("allows a clear same-column route with zero corners", () => {
    const tiles = placed([["a", "A", 0, 1], ["b", "A", 2, 1]]);
    expect(pathFor(tiles)).toEqual([{ r: 0, c: 1 }, { r: 2, c: 1 }]);
  });

  it("allows one internal corner", () => {
    const tiles = placed([["a", "A", 0, 0], ["b", "A", 2, 2]]);
    expect(pathFor(tiles)).toHaveLength(3);
  });

  it("allows two internal corners", () => {
    const tiles = placed([
      ["a", "A", 0, 0], ["b", "A", 2, 2], ["x", "B", 0, 2], ["y", "B", 2, 0],
    ]);
    expect(pathFor(tiles)).toEqual([{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 2, c: 1 }, { r: 2, c: 2 }]);
  });

  it("allows two corners through each virtual outer border", () => {
    const left = placed([["a", "A", 0, 0], ["b", "A", 2, 2], ["x", "B", 0, 2], ["y", "B", 1, 0]]);
    const right = placed([["a", "A", 0, 2], ["b", "A", 2, 0], ["x", "B", 0, 0], ["y", "B", 1, 2], ["z", "B", 0, 1]]);
    const top = placed([["a", "A", 2, 0], ["b", "A", 0, 2], ["x", "B", 0, 1], ["y", "B", 2, 2]]);
    const bottom = placed([["a", "A", 0, 0], ["b", "A", 2, 2], ["x", "B", 0, 2], ["y", "B", 2, 1], ["z", "B", 1, 1]]);
    expect(pathFor(left)?.some((point) => point.c === -1)).toBe(true);
    expect(pathFor(right)?.some((point) => point.c === 3)).toBe(true);
    expect(pathFor(top)?.some((point) => point.r === -1)).toBe(true);
    expect(pathFor(bottom)?.some((point) => point.r === 3)).toBe(true);
  });

  it("rejects blocked paths, different kinds, identical instances, and removed endpoints", () => {
    const blocked = placed([
      ["a", "A", 1, 0], ["b", "A", 1, 2],
      ["c1", "B", 0, 0], ["c2", "B", 0, 1], ["c3", "B", 0, 2],
      ["c4", "B", 1, 1], ["c5", "B", 2, 0], ["c6", "B", 2, 1], ["c7", "B", 2, 2],
    ]);
    const [a, b] = blocked;
    expect(evaluatePairMatch(blocked, a, b, 3, 3)).toEqual({ reason: "blocked-path" });
    expect(evaluatePairMatch(blocked, a, { ...b, kind: "C" }, 3, 3)).toEqual({ reason: "different-kind" });
    expect(evaluatePairMatch(blocked, a, a, 3, 3)).toEqual({ reason: "invalid-tile" });
    expect(evaluatePairMatch(blocked, a, { ...b, removed: true }, 3, 3)).toEqual({ reason: "invalid-tile" });
  });

  it("finds a valid path on a large board", () => {
    const tiles = placed([["a", "A", 0, 0], ["b", "A", 15, 15]]);
    expect(pathFor(tiles, "a", "b", 16, 16)).not.toBeNull();
  });
});

describe("state helpers", () => {
  const mk = (id: string, kind: string, removed = false): PairTile => ({
    id, kind, row: 0, col: 0, removed,
  });

  it("removed pair updates state", () => {
    const tiles = [mk("a", "legacy:01"), mk("b", "legacy:01"), mk("c", "new:035")];
    const next = removeMatchedPair(tiles, "a", "b");
    expect(next.find((t) => t.id === "a")?.removed).toBe(true);
    expect(next.find((t) => t.id === "b")?.removed).toBe(true);
    expect(next.find((t) => t.id === "c")?.removed).toBe(false);
  });

  it("remaining pair count works", () => {
    const tiles = board(CATALOG_20, 8, 8);
    expect(getRemainingPairs(tiles)).toBe(32);
    const [a, b] = tiles.filter((t) => t.kind === tiles[0].kind);
    const next = removeMatchedPair(tiles, a.id, b.id);
    expect(getRemainingPairs(next)).toBe(31);
  });

  it("board cleared detection works", () => {
    let tiles = board(CATALOG_20, 8, 8);
    expect(isBoardCleared(tiles)).toBe(false);
    tiles = tiles.map((t) => ({ ...t, removed: true }));
    expect(isBoardCleared(tiles)).toBe(true);
  });

  it("always applies vertical downward gravity, regardless of level", () => {
    const tiles = [
      { id: "a", kind: "A", row: 0, col: 0, removed: false },
      { id: "b", kind: "B", row: 1, col: 1, removed: false },
      { id: "c", kind: "C", row: 2, col: 0, removed: false },
    ];

    for (const level of [1, 2, 3, 4, 5, 10]) {
      const fallen = applyGravity(tiles, level, 3, 3);
      expect(fallen.map(({ id, row, col }) => ({ id, row, col }))).toEqual([
        { id: "a", row: 1, col: 0 },
        { id: "b", row: 2, col: 1 },
        { id: "c", row: 2, col: 0 },
      ]);
    }
  });
});

// ── mulberry32 exported for catalog tests ─────────────────────────────────────
describe("mulberry32 RNG", () => {
  it("is deterministic with same seed", () => {
    const a = mulberry32(1);
    const b = mulberry32(1);
    expect(a()).toBe(b());
    expect(a()).toBe(b());
  });
});
