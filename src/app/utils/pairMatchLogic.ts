export type TileKind =
  | "peanut"
  | "cat"
  | "dog"
  | "bamboo"
  | "kite"
  | "stork"
  | "rice"
  | "drum";

export interface PairTile {
  id: string;
  kind: TileKind;
  row: number;
  col: number;
  removed: boolean;
}

export const BOARD_ROWS = 4;
export const BOARD_COLS = 4;

const TILE_KINDS: TileKind[] = [
  "peanut",
  "cat",
  "dog",
  "bamboo",
  "kite",
  "stork",
  "rice",
  "drum",
];

/**
 * Small deterministic PRNG (mulberry32) so a given seed always produces
 * the same shuffle — handy for tests and reproducible boards.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fisherYatesShuffle<T>(arr: T[], rng: () => number): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Build a fresh 4x4 board. The number of kinds used equals (ROWS*COLS)/2,
 * each kind appears exactly twice, then everything is shuffled and placed
 * into the grid.
 */
export function createPairBoard(seed?: number): PairTile[] {
  const total = BOARD_ROWS * BOARD_COLS;
  const pairCount = total / 2;
  const kinds = TILE_KINDS.slice(0, pairCount);

  const doubled: TileKind[] = [];
  for (const kind of kinds) {
    doubled.push(kind, kind);
  }

  const rng = mulberry32(seed ?? (Math.random() * 0xffffffff) >>> 0);
  const shuffled = fisherYatesShuffle(doubled, rng);

  return shuffled.map((kind, index) => ({
    id: `tile-${index}`,
    kind,
    row: Math.floor(index / BOARD_COLS),
    col: index % BOARD_COLS,
    removed: false,
  }));
}

/** Two tiles match when they are distinct, both present, and share a kind. */
export function canMatch(a: PairTile, b: PairTile): boolean {
  if (a.id === b.id) return false;
  if (a.removed || b.removed) return false;
  return a.kind === b.kind;
}

/**
 * Onet-style connectivity check: two tiles can be linked only if they share a
 * kind AND a clear path connects them through empty cells (removed tiles or the
 * one-cell border around the board) with at most 2 turns. If the path can't be
 * drawn as a straight line, an "L", or a "U/Z" shape, they cannot be matched.
 */
export function canConnect(
  tiles: PairTile[],
  aId: string,
  bId: string,
  rows: number = BOARD_ROWS,
  cols: number = BOARD_COLS
): boolean {
  const a = tiles.find((t) => t.id === aId);
  const b = tiles.find((t) => t.id === bId);
  if (!a || !b) return false;
  if (!canMatch(a, b)) return false;

  // Grid padded by one empty cell on every side so paths may route outside.
  const GR = rows + 2;
  const GC = cols + 2;
  const blocked: boolean[][] = Array.from({ length: GR }, () =>
    Array.from({ length: GC }, () => false)
  );
  for (const t of tiles) {
    if (!t.removed) blocked[t.row + 1][t.col + 1] = true;
  }

  const ar = a.row + 1;
  const ac = a.col + 1;
  const br = b.row + 1;
  const bc = b.col + 1;
  // Endpoints are passable for the travelling path.
  blocked[ar][ac] = false;
  blocked[br][bc] = false;

  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  // best[r][c][dir] = fewest turns used to arrive at (r,c) heading `dir`.
  const best: number[][][] = Array.from({ length: GR }, () =>
    Array.from({ length: GC }, () => [99, 99, 99, 99])
  );

  type Node = { r: number; c: number; dir: number; turns: number };
  const queue: Node[] = [{ r: ar, c: ac, dir: -1, turns: 0 }];

  while (queue.length) {
    const cur = queue.shift()!;
    for (let d = 0; d < 4; d++) {
      const turns = cur.turns + (cur.dir !== -1 && cur.dir !== d ? 1 : 0);
      if (turns > 2) continue;
      const nr = cur.r + dirs[d][0];
      const nc = cur.c + dirs[d][1];
      if (nr < 0 || nr >= GR || nc < 0 || nc >= GC) continue;
      if (nr === br && nc === bc) return true; // reached the target
      if (blocked[nr][nc]) continue;
      if (best[nr][nc][d] <= turns) continue;
      best[nr][nc][d] = turns;
      queue.push({ r: nr, c: nc, dir: d, turns });
    }
  }
  return false;
}

/** True if at least one connectable pair currently exists on the board. */
export function hasAvailableMove(
  tiles: PairTile[],
  rows: number = BOARD_ROWS,
  cols: number = BOARD_COLS
): boolean {
  const visible = tiles.filter((t) => !t.removed);
  for (let i = 0; i < visible.length; i++) {
    for (let j = i + 1; j < visible.length; j++) {
      if (canConnect(tiles, visible[i].id, visible[j].id, rows, cols)) {
        return true;
      }
    }
  }
  return false;
}

export function removeMatchedPair(
  tiles: PairTile[],
  firstId: string,
  secondId: string
): PairTile[] {
  return tiles.map((tile) =>
    tile.id === firstId || tile.id === secondId
      ? { ...tile, removed: true }
      : tile
  );
}

export function getRemainingPairs(tiles: PairTile[]): number {
  return tiles.filter((tile) => !tile.removed).length / 2;
}

export function isBoardCleared(tiles: PairTile[]): boolean {
  return tiles.every((tile) => tile.removed);
}

/**
 * Re-shuffle the kinds of the still-visible tiles across their existing
 * positions (used internally by createPairBoard via re-creation, exposed
 * here per the spec for reshuffling an in-progress board).
 */
export function shuffleTiles(tiles: PairTile[], seed?: number): PairTile[] {
  const rng = mulberry32(seed ?? (Math.random() * 0xffffffff) >>> 0);
  const kinds = fisherYatesShuffle(
    tiles.map((t) => t.kind),
    rng
  );
  return tiles.map((tile, i) => ({ ...tile, kind: kinds[i] }));
}
