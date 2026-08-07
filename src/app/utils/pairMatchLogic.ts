/** Tile kind = global character ID, e.g. "legacy:01" or "new:035". */
export type TileKind = string;

export interface PairTile {
  id: string;
  kind: TileKind;
  row: number;
  col: number;
  removed: boolean;
}

export const BOARD_SIZES = [8, 10, 12, 14, 16] as const;
export const MAX_BOARD_LEVEL = BOARD_SIZES.length;

export function getBoardSize(level: number) {
  // The final 16×16 board repeats as the documented endless challenge.
  const size = BOARD_SIZES[Math.min(Math.max(level, 1), MAX_BOARD_LEVEL) - 1];
  return { rows: size, cols: size };
}

export function mulberry32(seed: number): () => number {
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
 * Create a board using a balanced pair distribution.
 *
 * Steps:
 *  1. Determine pairCount = rows*cols/2
 *  2. activeCharacterCount = min(pairCount, catalog.length)
 *  3. Fisher-Yates shuffle catalog, pick first activeCharacterCount
 *  4. Assign base + optional extra pairs so max-diff ≤ 1
 *  5. Flatten to [kind, kind, …], shuffle positions
 *
 * @param characterIds  Global character IDs from the loaded catalog
 * @param rows          Board rows
 * @param cols          Board cols
 * @param seed          Optional RNG seed (for tests)
 */
export function createPairBoard(
  characterIds: readonly string[],
  rows: number,
  cols: number,
  seed?: number,
): PairTile[];

/** @deprecated Legacy overload (level-based). Pass characterIds explicitly. */
export function createPairBoard(level: number, seed?: number): PairTile[];

export function createPairBoard(
  characterIdsOrLevel: readonly string[] | number,
  rowsOrSeed?: number,
  cols?: number,
  seed?: number,
): PairTile[] {
  // Legacy overload support
  if (typeof characterIdsOrLevel === "number") {
    const level = characterIdsOrLevel;
    const legacySeed = rowsOrSeed;
    const { rows: r, cols: c } = getBoardSize(level);
    // Fallback: generate placeholder kinds until GameBoard provides real catalog
    const fallbackKinds: string[] = [];
    for (let i = 0; i < 20; i++) fallbackKinds.push(`legacy:${String(i + 1).padStart(2, "0")}`);
    return _createBoard(fallbackKinds, r, c, legacySeed);
  }

  const characterIds = characterIdsOrLevel;
  const rows2 = rowsOrSeed!;
  const cols2 = cols!;
  return _createBoard(characterIds, rows2, cols2, seed);
}

function _createBoard(
  characterIds: readonly string[],
  rows: number,
  cols: number,
  seed?: number,
): PairTile[] {
  const total = rows * cols;
  if (total % 2 !== 0) throw new Error(`Board size ${rows}×${cols} is not even`);
  const pairCount = total / 2;

  const rng = mulberry32(seed ?? (Math.random() * 0xffffffff) >>> 0);

  // Step 1: pick active characters
  const activeCount = Math.min(pairCount, characterIds.length);
  if (activeCount === 0) throw new Error("No character IDs provided");
  const shuffledCatalog = fisherYatesShuffle([...characterIds], rng);
  const active = shuffledCatalog.slice(0, activeCount);

  // Step 2: balanced pair distribution
  const basePairs = Math.floor(pairCount / activeCount);
  const extraPairs = pairCount % activeCount;
  // Shuffle active pool to randomise which chars get the extra pair
  const shuffledActive = fisherYatesShuffle(active, rng);

  const kindList: string[] = [];
  for (let i = 0; i < activeCount; i++) {
    const pairs = basePairs + (i < extraPairs ? 1 : 0);
    for (let p = 0; p < pairs; p++) {
      kindList.push(shuffledActive[i]);
    }
  }

  // Step 3: duplicate each kind into 2 tiles, shuffle positions
  const tileKinds: string[] = [];
  for (const k of kindList) tileKinds.push(k, k);

  const shuffledKinds = fisherYatesShuffle(tileKinds, rng);
  const runId = Math.floor(Math.random() * 1000000);

  return shuffledKinds.map((kind, index) => ({
    id: `tile-${runId}-${index}`,
    kind,
    row: Math.floor(index / cols),
    col: index % cols,
    removed: false,
  }));
}

export interface Point { r: number; c: number; }

export type PairMatchResult =
  | { reason: "match"; path: Point[] }
  | { reason: "different-kind" | "blocked-path" | "invalid-tile" };

export interface AvailableMatch {
  first: PairTile;
  second: PairTile;
  path: Point[];
}

export function buildBoardOccupancy(tiles: PairTile[], rows: number, cols: number): Uint8Array {
  const occupancy = new Uint8Array(rows * cols);
  for (const tile of tiles) {
    if (!tile.removed) occupancy[tile.row * cols + tile.col] = 1;
  }
  return occupancy;
}

export function findPikachuPath(
  tiles: PairTile[],
  a: PairTile,
  b: PairTile,
  rows: number,
  cols: number,
  occupancy?: Uint8Array,
): Point[] | null {
  if (a.kind !== b.kind || a.id === b.id || a.removed || b.removed) return null;
  const boardOccupancy = occupancy ?? buildBoardOccupancy(tiles, rows, cols);

  const isEmptyNode = (r: number, c: number) => {
    if (r === a.row && c === a.col) return true;
    if (r === b.row && c === b.col) return true;
    if (r < -1 || r > rows || c < -1 || c > cols) return false;
    if (r === -1 || r === rows || c === -1 || c === cols) return true;
    return boardOccupancy[r * cols + c] === 0;
  };

  const checkLine = (p1: Point, p2: Point) => {
    if (p1.r !== p2.r && p1.c !== p2.c) return false;
    if (p1.r === p2.r) {
      const min = Math.min(p1.c, p2.c);
      const max = Math.max(p1.c, p2.c);
      for (let c = min + 1; c < max; c++) {
        if (!isEmptyNode(p1.r, c)) return false;
      }
      return true;
    } else {
      const min = Math.min(p1.r, p2.r);
      const max = Math.max(p1.r, p2.r);
      for (let r = min + 1; r < max; r++) {
        if (!isEmptyNode(r, p1.c)) return false;
      }
      return true;
    }
  };

  // 0 turns
  if (checkLine({ r: a.row, c: a.col }, { r: b.row, c: b.col })) {
    return [{ r: a.row, c: a.col }, { r: b.row, c: b.col }];
  }

  // 1 turn
  const pC1 = { r: a.row, c: b.col };
  if (isEmptyNode(pC1.r, pC1.c) && checkLine({ r: a.row, c: a.col }, pC1) && checkLine(pC1, { r: b.row, c: b.col })) {
    return [{ r: a.row, c: a.col }, pC1, { r: b.row, c: b.col }];
  }
  const pC2 = { r: b.row, c: a.col };
  if (isEmptyNode(pC2.r, pC2.c) && checkLine({ r: a.row, c: a.col }, pC2) && checkLine(pC2, { r: b.row, c: b.col })) {
    return [{ r: a.row, c: a.col }, pC2, { r: b.row, c: b.col }];
  }

  // 2 turns (horizontal scan)
  for (let c = -1; c <= cols; c++) {
    const p1 = { r: a.row, c };
    const p2 = { r: b.row, c };
    if (isEmptyNode(p1.r, p1.c) && isEmptyNode(p2.r, p2.c)) {
      if (checkLine({ r: a.row, c: a.col }, p1) && checkLine(p1, p2) && checkLine(p2, { r: b.row, c: b.col })) {
        const path = [{ r: a.row, c: a.col }];
        if (p1.r !== a.row || p1.c !== a.col) path.push(p1);
        if (p2.r !== p1.r || p2.c !== p1.c) path.push(p2);
        if (b.row !== p2.r || b.col !== p2.c) path.push({ r: b.row, c: b.col });
        return path;
      }
    }
  }

  // 2 turns (vertical scan)
  for (let r = -1; r <= rows; r++) {
    const p1 = { r, c: a.col };
    const p2 = { r, c: b.col };
    if (isEmptyNode(p1.r, p1.c) && isEmptyNode(p2.r, p2.c)) {
      if (checkLine({ r: a.row, c: a.col }, p1) && checkLine(p1, p2) && checkLine(p2, { r: b.row, c: b.col })) {
        const path = [{ r: a.row, c: a.col }];
        if (p1.r !== a.row || p1.c !== a.col) path.push(p1);
        if (p2.r !== p1.r || p2.c !== p1.c) path.push(p2);
        if (b.row !== p2.r || b.col !== p2.c) path.push({ r: b.row, c: b.col });
        return path;
      }
    }
  }

  return null;
}

/**
 * Separates identity errors from pathfinding errors so UI feedback can remain
 * truthful. A physical tile instance (`id`) is never its match identity.
 */
export function evaluatePairMatch(
  tiles: PairTile[],
  a: PairTile,
  b: PairTile,
  rows: number,
  cols: number,
  occupancy?: Uint8Array,
): PairMatchResult {
  if (a.id === b.id || a.removed || b.removed) return { reason: "invalid-tile" };
  if (a.kind !== b.kind) return { reason: "different-kind" };

  const path = findPikachuPath(tiles, a, b, rows, cols, occupancy);
  return path ? { reason: "match", path } : { reason: "blocked-path" };
}

/** Finds one real, currently connectable pair for Hint and Bomb. */
export function findAvailableMatch(
  tiles: PairTile[],
  rows: number,
  cols: number,
): AvailableMatch | null {
  const visible = tiles.filter((tile) => !tile.removed);
  const occupancy = buildBoardOccupancy(tiles, rows, cols);
  for (let i = 0; i < visible.length; i += 1) {
    for (let j = i + 1; j < visible.length; j += 1) {
      const result = evaluatePairMatch(tiles, visible[i], visible[j], rows, cols, occupancy);
      if (result.reason === "match") {
        return { first: visible[i], second: visible[j], path: result.path };
      }
    }
  }
  return null;
}

export function canMatch(
  tiles: PairTile[],
  a: PairTile,
  b: PairTile,
  rows: number,
  cols: number,
  occupancy?: Uint8Array,
): boolean {
  return evaluatePairMatch(tiles, a, b, rows, cols, occupancy).reason === "match";
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

export function hasAnyMatch(tiles: PairTile[], rows: number, cols: number): boolean {
  const visible = tiles.filter((t) => !t.removed);
  const occupancy = buildBoardOccupancy(tiles, rows, cols);
  for (let i = 0; i < visible.length; i++) {
    for (let j = i + 1; j < visible.length; j++) {
      if (canMatch(tiles, visible[i], visible[j], rows, cols, occupancy)) {
        return true;
      }
    }
  }
  return false;
}

export function shuffleRemaining(tiles: PairTile[], seed?: number): PairTile[] {
  const visible = tiles.filter((t) => !t.removed);
  const rng = mulberry32(seed ?? (Math.random() * 0xffffffff) >>> 0);
  const shuffledKinds = fisherYatesShuffle(visible.map(t => t.kind), rng);

  let kindIndex = 0;
  return tiles.map((tile) => {
    if (tile.removed) return tile;
    return { ...tile, kind: shuffledKinds[kindIndex++] };
  });
}

/**
 * Make every remaining tile fall vertically to the bottom of its own column.
 *
 * `level` remains in the signature so existing callers keep their stable
 * contract, but gravity is deliberately no longer level-dependent.
 */
export function applyGravity(tiles: PairTile[], _level: number, rows: number, cols: number): PairTile[] {
  const grid: (PairTile | null)[][] = Array(rows)
    .fill(null)
    .map(() => Array(cols).fill(null));

  tiles.forEach((t) => {
    if (!t.removed) {
      grid[t.row][t.col] = t;
    }
  });

  const nextGrid: (PairTile | null)[][] = Array(rows)
    .fill(null)
    .map(() => Array(cols).fill(null));

  for (let c = 0; c < cols; c++) {
    let writeR = rows - 1;
    for (let r = rows - 1; r >= 0; r--) {
      if (grid[r][c]) {
        nextGrid[writeR--][c] = grid[r][c];
      }
    }
  }

  // Map the new coordinates back to the tiles
  return tiles.map((t) => {
    if (t.removed) return t;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (nextGrid[r][c] && nextGrid[r][c]!.id === t.id) {
          if (t.row !== r || t.col !== c) {
            return { ...t, row: r, col: c };
          }
          return t;
        }
      }
    }
    return t;
  });
}
