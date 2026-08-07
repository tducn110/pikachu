import { useCallback, useEffect, useRef, useState } from "react";
import {
  evaluatePairMatch,
  findAvailableMatch,
  getBoardSize,
  getRemainingPairs,
  hasAnyMatch,
  isBoardCleared,
  shuffleRemaining,
  type PairTile,
  type Point,
} from "../utils/pairMatchLogic";
import { useGameAudio } from "./useGameAudio";
import { useGameSession, type GameStatus } from "./useGameSession";
import { useGameBoard } from "./useGameBoard";
import { type ScoreStats } from "../utils/stats";
import { perfDiagnostics } from "../components/game/pixi/pixiPerfDiagnostics";

export interface UsePairMatchGame {
  tiles: PairTile[];
  selectedIds: string[];
  wrongIds: string[];
  wrongReason: "different-kind" | "blocked-path" | null;
  hintIds: string[];
  activePath: Point[] | null;
  shuffleNotice: boolean;
  score: number;
  level: number;
  moves: number;
  combo: number;
  timeLeft: number;
  maxTime: number;
  remainingPairs: number;
  status: GameStatus;
  stats: ScoreStats;
  sfxEnabled: boolean;
  musicEnabled: boolean;
  setSfxEnabled: (v: boolean) => void;
  setMusicEnabled: (v: boolean) => void;
  selectTile: (tileId: string) => void;
  resetGame: () => void;
  nextLevel: () => void;
  hintPair: () => void;
  shuffleBoard: () => void;
  bombPair: () => void;
}

export function usePairMatchGame({ isPaused = false }: { isPaused?: boolean } = {}): UsePairMatchGame {
  const audio = useGameAudio();
  const session = useGameSession();
  const board = useGameBoard();
  const [shuffleNotice, setShuffleNotice] = useState(false);
  const [wrongReason, setWrongReason] = useState<"different-kind" | "blocked-path" | null>(null);

  const lockRef = useRef(false);
  const wonRef = useRef(false);
  const runIdRef = useRef(0);
  const timeoutIdsRef = useRef(new Set<ReturnType<typeof setTimeout>>());

  const scheduleForCurrentRun = useCallback((callback: () => void, delay: number) => {
    const runId = runIdRef.current;
    const timeoutId = setTimeout(() => {
      timeoutIdsRef.current.delete(timeoutId);
      if (runIdRef.current === runId) callback();
    }, delay);
    timeoutIdsRef.current.add(timeoutId);
  }, []);

  const invalidateRun = useCallback(() => {
    runIdRef.current += 1;
    for (const timeoutId of timeoutIdsRef.current) clearTimeout(timeoutId);
    timeoutIdsRef.current.clear();
    lockRef.current = false;
  }, []);

  useEffect(() => () => {
    for (const timeoutId of timeoutIdsRef.current) clearTimeout(timeoutId);
    timeoutIdsRef.current.clear();
  }, []);

  const remainingPairs = getRemainingPairs(board.tiles);

  const selectTile = useCallback(
    (tileId: string) => {
      if (lockRef.current || session.status !== "playing" || isPaused) return;
      const tile = board.tiles.find((t) => t.id === tileId);
      if (!tile || tile.removed) return;
      if (board.selectedIds.includes(tileId)) return;

      board.setHintIds([]);
      audio.sfx("tap");

      const next = [...board.selectedIds, tileId];
      board.setSelectedIds(next);

      if (next.length < 2) return;

      const [firstId, secondId] = next;
      const a = board.tiles.find((t) => t.id === firstId)!;
      const b = board.tiles.find((t) => t.id === secondId)!;
      const { rows, cols } = getBoardSize(session.level);
      const result = perfDiagnostics.measure("pikachu.path.find", () =>
        evaluatePairMatch(board.tiles, a, b, rows, cols),
      );

      if (result.reason === "match") {
        board.setActivePath(result.path);
        lockRef.current = true;
        audio.sfx("match");
        scheduleForCurrentRun(() => {
          session.increaseCombo();
          const newCombo = session.combo + 1;
          session.addScore(100 + 20 * (newCombo - 1));
          session.addTime(3); // Add 3 seconds for every match
          
          board.removePair(firstId, secondId, session.level, rows, cols);
          board.setSelectedIds([]);
          board.setActivePath(null);
          lockRef.current = false;

        }, 400);
      } else {
        audio.sfx("wrong");
        lockRef.current = true;
        board.setWrongIds([firstId, secondId]);
        setWrongReason(result.reason === "different-kind" ? "different-kind" : "blocked-path");
        session.addMove();
        session.resetCombo();

        scheduleForCurrentRun(() => {
          board.setWrongIds([]);
          setWrongReason(null);
          board.setSelectedIds([]);
          lockRef.current = false;
        }, 700);
      }
    },
    [board.tiles, board.selectedIds, board.setActivePath, board.setHintIds, board.setSelectedIds, board.setWrongIds, board.removePair, session.status, session.level, session.combo, session.addMove, session.addScore, session.addTime, session.increaseCombo, session.resetCombo, audio.sfx, isPaused, scheduleForCurrentRun]
  );

  // Detect win or reshuffle
  useEffect(() => {
    if (session.status === "playing" && board.tiles.length > 0) {
      if (isBoardCleared(board.tiles)) {
        if (wonRef.current) return;
        wonRef.current = true;
        audio.sfx("win");
        session.setWon();
      } else {
        const { rows, cols } = getBoardSize(session.level);
        const boardChanged = board.shuffleIfNoMatch(rows, cols);
        if (boardChanged) {
          setShuffleNotice(true);
          audio.sfx("reset"); // play a sound for reshuffle
          scheduleForCurrentRun(() => setShuffleNotice(false), 2000);
        }
      }
    }
  }, [board.tiles, session.status, session.setWon, board.shuffleIfNoMatch, audio.sfx, scheduleForCurrentRun]);

  // Timer loop
  useEffect(() => {
    if (session.status !== "playing" || isPaused) return;
    const interval = setInterval(() => {
      session.tickTime(1);
    }, 1000);
    return () => clearInterval(interval);
  }, [session.status, session.tickTime, isPaused]);

  // Check loss condition
  useEffect(() => {
    if (session.status === "playing" && session.timeLeft === 0) {
      session.setLost();
      audio.sfx("wrong"); // Maybe add a game-over sound instead if available, 'wrong' works for now
    }
  }, [session.timeLeft, session.status, session.setLost, audio.sfx]);

  const resetGame = useCallback(() => {
    invalidateRun();
    wonRef.current = false;
    setWrongReason(null);
    setShuffleNotice(false);
    board.resetBoard(1);
    session.resetSession(false);
    audio.sfx("reset");
  }, [invalidateRun, board.resetBoard, session.resetSession, audio.sfx]);

  const nextLevel = useCallback(() => {
    invalidateRun();
    wonRef.current = false;
    setWrongReason(null);
    setShuffleNotice(false);
    board.resetBoard(session.level + 1);
    session.resetSession(true);
    audio.sfx("reset");
  }, [invalidateRun, board.resetBoard, session.level, session.resetSession, audio.sfx]);

  const hintPair = useCallback(() => {
    if (session.status !== "playing" || lockRef.current || isPaused) return;
    perfDiagnostics.count("pikachu.hint.calls");
    const scanStartedAt = perfDiagnostics.start("pikachu.hint.scan");
    const { rows, cols } = getBoardSize(session.level);
    const match = findAvailableMatch(board.tiles, rows, cols);
    if (match) {
      board.setHintIds([match.first.id, match.second.id]);
      session.addScore(-50); // Penalty for hint
      audio.sfx("tap");
      scheduleForCurrentRun(() => board.setHintIds([]), 1200);
      perfDiagnostics.end("pikachu.hint.scan", scanStartedAt);
      return;
    }
    perfDiagnostics.end("pikachu.hint.scan", scanStartedAt);
  }, [board.tiles, board.setHintIds, session.status, session.level, session.addScore, audio.sfx, isPaused, scheduleForCurrentRun]);

  const shuffleBoard = useCallback(() => {
    if (session.status !== "playing" || lockRef.current || isPaused) return;
    perfDiagnostics.count("pikachu.shuffle.calls");
    const { rows, cols } = getBoardSize(session.level);
    lockRef.current = true;
    board.setSelectedIds([]);
    board.setWrongIds([]);
    board.setHintIds([]);
    board.setActivePath(null);
    setWrongReason(null);
    board.setTiles((prev) => perfDiagnostics.measure("pikachu.shuffle.validation", () => {
      let nextBoard = shuffleRemaining(prev);
      let attempts = 0;
      while (!hasAnyMatch(nextBoard, rows, cols) && attempts < 50) {
        nextBoard = shuffleRemaining(nextBoard);
        attempts += 1;
      }
      perfDiagnostics.count("pikachu.shuffle.validationAttempts", attempts + 1);
      return nextBoard;
    }));
    session.addMove();
    audio.sfx("reset");
    lockRef.current = false;
  }, [board.setSelectedIds, board.setWrongIds, board.setHintIds, board.setActivePath, board.setTiles, session.status, session.level, session.addMove, audio.sfx, isPaused]);

  const bombPair = useCallback(() => {
    if (session.status !== "playing" || lockRef.current || isPaused) return;
    const { rows, cols } = getBoardSize(session.level);
    const match = findAvailableMatch(board.tiles, rows, cols);
    if (!match) return;

    lockRef.current = true;
    board.setSelectedIds([]);
    board.setWrongIds([]);
    board.setHintIds([]);
    board.setActivePath(match.path);
    setWrongReason(null);
    session.addMove();
    audio.sfx("match");

    scheduleForCurrentRun(() => {
      board.removePair(match.first.id, match.second.id, session.level, rows, cols);
      board.setActivePath(null);
      lockRef.current = false;
    }, 400);
  }, [board.tiles, board.setSelectedIds, board.setWrongIds, board.setHintIds, board.setActivePath, board.removePair, session.status, session.level, session.addMove, audio.sfx, isPaused, scheduleForCurrentRun]);

  return {
    tiles: board.tiles,
    selectedIds: board.selectedIds,
    wrongIds: board.wrongIds,
    wrongReason,
    hintIds: board.hintIds,
    activePath: board.activePath,
    shuffleNotice,
    score: session.score,
    level: session.level,
    moves: session.moves,
    combo: session.combo,
    timeLeft: session.timeLeft,
    maxTime: session.maxTime,
    remainingPairs,
    status: session.status,
    stats: session.stats,
    sfxEnabled: audio.sfxEnabled,
    musicEnabled: audio.musicEnabled,
    setSfxEnabled: audio.setSfxEnabled,
    setMusicEnabled: audio.setMusicEnabled,
    selectTile,
    resetGame,
    nextLevel,
    hintPair,
    shuffleBoard,
    bombPair,
  };
}
