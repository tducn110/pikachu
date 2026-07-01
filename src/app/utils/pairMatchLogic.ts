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

export function getBoardSize(level: number) {
  if (level <= 2) return { rows: 4, cols: 4 };
  if (level <= 5) return { rows: 4, cols: 6 };
  if (level <= 10) return { rows: 4, cols: 8 };
  if (level <= 15) return { rows: 6, cols: 8 };
  if (level <= 25) return { rows: 6, cols: 10 };
  if (level <= 35) return { rows: 6, cols: 12 };
  return { rows: 8, cols: 12 }; // Max size
}

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

export function createPairBoard(level: number, seed?: number): PairTile[] {
  const { rows, cols } = getBoardSize(level);
  const total = rows * cols;
  const pairCount = total / 2;

  const doubled: TileKind[] = [];
  for (let i = 0; i < pairCount; i++) {
    const kind = TILE_KINDS[i % TILE_KINDS.length];
    doubled.push(kind, kind);
  }

  const rng = mulberry32(seed ?? (Math.random() * 0xffffffff) >>> 0);
  const shuffled = fisherYatesShuffle(doubled, rng);
  const runId = Math.floor(Math.random() * 1000000);

  return shuffled.map((kind, index) => ({
    id: `tile-${runId}-${index}`,
    kind,
    row: Math.floor(index / cols),
    col: index % cols,
    removed: false,
  }));
}

export interface Point { r: number; c: number; }

export function findPikachuPath(tiles: PairTile[], a: PairTile, b: PairTile, rows: number, cols: number): Point[] | null {
  if (a.kind !== b.kind || a.id === b.id) return null;

  const isEmptyNode = (r: number, c: number) => {
    if (r === a.row && c === a.col) return true;
    if (r === b.row && c === b.col) return true;
    if (r < -1 || r > rows || c < -1 || c > cols) return false;
    if (r === -1 || r === rows || c === -1 || c === cols) return true;
    const activeTile = tiles.find(tile => tile.row === r && tile.col === c && !tile.removed);
    return !activeTile;
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

export function canMatch(tiles: PairTile[], a: PairTile, b: PairTile, rows: number, cols: number): boolean {
  if (a.id === b.id) return false;
  if (a.removed || b.removed) return false;
  return findPikachuPath(tiles, a, b, rows, cols) !== null;
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
  for (let i = 0; i < visible.length; i++) {
    for (let j = i + 1; j < visible.length; j++) {
      if (canMatch(tiles, visible[i], visible[j], rows, cols)) {
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

export function applyGravity(tiles: PairTile[], level: number, rows: number, cols: number): PairTile[] {
  const mode = level % 5;
  if (mode === 1) return tiles; // No shift (Level 1, 6, 11...)

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

  if (mode === 2) {
    // Shift Down
    for (let c = 0; c < cols; c++) {
      let writeR = rows - 1;
      for (let r = rows - 1; r >= 0; r--) {
        if (grid[r][c]) {
          nextGrid[writeR--][c] = grid[r][c];
        }
      }
    }
  } else if (mode === 3) {
    // Shift Left
    for (let r = 0; r < rows; r++) {
      let writeC = 0;
      for (let c = 0; c < cols; c++) {
        if (grid[r][c]) {
          nextGrid[r][writeC++] = grid[r][c];
        }
      }
    }
  } else if (mode === 4) {
    // Shift Up
    for (let c = 0; c < cols; c++) {
      let writeR = 0;
      for (let r = 0; r < rows; r++) {
        if (grid[r][c]) {
          nextGrid[writeR++][c] = grid[r][c];
        }
      }
    }
  } else if (mode === 0) {
    // Shift Right
    for (let r = 0; r < rows; r++) {
      let writeC = cols - 1;
      for (let c = cols - 1; c >= 0; c--) {
        if (grid[r][c]) {
          nextGrid[r][writeC--] = grid[r][c];
        }
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
