import { useCallback, useEffect, useRef, useState } from "react";
import {
  createPairBoard,
  canConnect,
  hasAvailableMove,
  shuffleTiles,
  removeMatchedPair,
  getRemainingPairs,
  isBoardCleared,
  type PairTile,
} from "../utils/pairMatchLogic";

/** Re-shuffle the visible tiles until at least one connectable pair exists. */
function reshuffleUntilSolvable(tiles: PairTile[]): PairTile[] {
  let next = tiles;
  for (let attempt = 0; attempt < 30; attempt++) {
    next = shuffleTiles(next);
    if (hasAvailableMove(next)) return next;
  }
  return next;
}

export type GameStatus = "playing" | "won";

type Sfx = "tap" | "match" | "wrong" | "win" | "reset";

export interface ScoreStats {
  best: number;
  last: number;
  totalGames: number;
}

const STORAGE_KEY = "bolac-pairmatch-stats";

function loadStats(): ScoreStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ScoreStats;
  } catch {
    /* ignore */
  }
  return { best: 0, last: 0, totalGames: 0 };
}

function saveStats(stats: ScoreStats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    /* ignore */
  }
}

/** Tiny WebAudio blip generator — no external assets. */
function playBeep(type: Sfx) {
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const cfg: Record<Sfx, { freq: number; dur: number; type: OscillatorType }> =
      {
        tap: { freq: 520, dur: 0.07, type: "sine" },
        match: { freq: 740, dur: 0.16, type: "triangle" },
        wrong: { freq: 180, dur: 0.18, type: "sawtooth" },
        win: { freq: 880, dur: 0.45, type: "triangle" },
        reset: { freq: 360, dur: 0.1, type: "sine" },
      };
    const { freq, dur, type: wave } = cfg[type];
    osc.type = wave;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.start();
    osc.stop(ctx.currentTime + dur);
    osc.onended = () => ctx.close();
  } catch {
    /* audio not available */
  }
}

export interface UsePairMatchGame {
  tiles: PairTile[];
  selectedIds: string[];
  wrongIds: string[];
  wrongReason: "kind" | "path" | null;
  hintIds: string[];
  score: number;
  moves: number;
  combo: number;
  remainingPairs: number;
  status: GameStatus;
  stats: ScoreStats;
  sfxEnabled: boolean;
  musicEnabled: boolean;
  setSfxEnabled: (v: boolean) => void;
  setMusicEnabled: (v: boolean) => void;
  selectTile: (tileId: string) => void;
  resetGame: () => void;
  hintPair: () => void;
}

export function usePairMatchGame(): UsePairMatchGame {
  const [tiles, setTiles] = useState<PairTile[]>(() => {
    const board = createPairBoard();
    return hasAvailableMove(board) ? board : reshuffleUntilSolvable(board);
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [wrongReason, setWrongReason] = useState<"kind" | "path" | null>(null);
  const [hintIds, setHintIds] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [combo, setCombo] = useState(0);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [stats, setStats] = useState<ScoreStats>(() => loadStats());
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(false);

  const lockRef = useRef(false);
  const wonRef = useRef(false);

  const sfx = useCallback(
    (type: Sfx) => {
      if (sfxEnabled) playBeep(type);
    },
    [sfxEnabled]
  );

  const remainingPairs = getRemainingPairs(tiles);

  const selectTile = useCallback(
    (tileId: string) => {
      if (lockRef.current || status === "won") return;
      const tile = tiles.find((t) => t.id === tileId);
      if (!tile || tile.removed) return;
      if (selectedIds.includes(tileId)) return;

      setHintIds([]);
      sfx("tap");

      const next = [...selectedIds, tileId];
      setSelectedIds(next);

      if (next.length < 2) return;

      const [firstId, secondId] = next;
      const a = tiles.find((t) => t.id === firstId)!;
      const b = tiles.find((t) => t.id === secondId)!;
      const sameKind = a.kind === b.kind;

      if (sameKind && canConnect(tiles, firstId, secondId)) {
        let nextTiles = removeMatchedPair(tiles, firstId, secondId);
        const newCombo = combo + 1;
        setCombo(newCombo);
        setScore((s) => s + 100 + 20 * (newCombo - 1));
        setSelectedIds([]);
        if (isBoardCleared(nextTiles)) {
          sfx("win");
        } else {
          sfx("match");
          // If the remaining tiles are deadlocked, reshuffle them.
          if (!hasAvailableMove(nextTiles)) {
            nextTiles = reshuffleUntilSolvable(nextTiles);
          }
        }
        setTiles(nextTiles);
      } else {
        sfx("wrong");
        lockRef.current = true;
        setWrongIds([firstId, secondId]);
        setWrongReason(sameKind ? "path" : "kind");
        setMoves((m) => m + 1);
        setCombo(0);
        setTimeout(() => {
          setWrongIds([]);
          setWrongReason(null);
          setSelectedIds([]);
          lockRef.current = false;
        }, 700);
      }
    },
    [tiles, selectedIds, combo, status, sfx]
  );

  // Detect win once the board is cleared and persist stats.
  useEffect(() => {
    if (status === "playing" && tiles.length > 0 && isBoardCleared(tiles)) {
      if (wonRef.current) return;
      wonRef.current = true;
      setStatus("won");
      setStats((prev) => {
        const updated: ScoreStats = {
          best: Math.max(prev.best, score),
          last: score,
          totalGames: prev.totalGames + 1,
        };
        saveStats(updated);
        return updated;
      });
    }
  }, [tiles, status, score]);

  const resetGame = useCallback(() => {
    lockRef.current = false;
    wonRef.current = false;
    let board = createPairBoard();
    if (!hasAvailableMove(board)) board = reshuffleUntilSolvable(board);
    setTiles(board);
    setSelectedIds([]);
    setWrongIds([]);
    setWrongReason(null);
    setHintIds([]);
    setScore(0);
    setMoves(0);
    setCombo(0);
    setStatus("playing");
    sfx("reset");
  }, [sfx]);

  const hintPair = useCallback(() => {
    if (status === "won" || lockRef.current) return;
    const visible = tiles.filter((t) => !t.removed);
    for (let i = 0; i < visible.length; i++) {
      for (let j = i + 1; j < visible.length; j++) {
        if (canConnect(tiles, visible[i].id, visible[j].id)) {
          setHintIds([visible[i].id, visible[j].id]);
          setScore((s) => Math.max(0, s - 50));
          sfx("tap");
          setTimeout(() => setHintIds([]), 1200);
          return;
        }
      }
    }
  }, [tiles, status, sfx]);

  return {
    tiles,
    selectedIds,
    wrongIds,
    wrongReason,
    hintIds,
    score,
    moves,
    combo,
    remainingPairs,
    status,
    stats,
    sfxEnabled,
    musicEnabled,
    setSfxEnabled,
    setMusicEnabled,
    selectTile,
    resetGame,
    hintPair,
  };
}
