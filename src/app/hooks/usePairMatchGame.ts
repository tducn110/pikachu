import { useCallback, useEffect, useRef, useState } from "react";
import {
  evaluatePairMatch,
  findAvailableMatch,
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

export type SupportType = "hint" | "shuffle" | "bomb";

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
  loseReason: "timeout" | "no_lives" | null;
  stats: ScoreStats;
  lives: number;
  supportStock: Record<SupportType, number>;
  supportAdUsed: Record<SupportType, boolean>;
  isSupportLocked: Record<SupportType, boolean>;
  sfxEnabled: boolean;
  musicEnabled: boolean;
  setSfxEnabled: (v: boolean) => void;
  setMusicEnabled: (v: boolean) => void;
  resumeAudioFromUserGesture: () => void;
  selectTile: (tileId: string) => void;
  resetGame: () => void;
  nextLevel: () => void;
  hintPair: () => void;
  shuffleBoard: () => void;
  bombPair: () => void;
  addSupport: (type: "hint" | "shuffle" | "bomb") => void;
  revive: (hearts: number) => void;
  doubleScore: () => void;
  setLost: (reason: "timeout" | "no_lives") => void;
}

export function computeSupportLockState(
  stock: Record<SupportType, number>,
  adUsed: Record<SupportType, boolean>
): Record<SupportType, boolean> {
  return {
    hint: stock.hint <= 0 && adUsed.hint,
    shuffle: stock.shuffle <= 0 && adUsed.shuffle,
    bomb: stock.bomb <= 0 && adUsed.bomb,
  };
}

/** A second tap on the current selection is an explicit cancellation. */
export function getSelectedIdsAfterTileTap(
  selectedIds: readonly string[],
  tileId: string,
): string[] {
  return selectedIds.includes(tileId) ? [] : [...selectedIds, tileId];
}

export function usePairMatchGame({
  isPaused = false,
  isAdPlaying = false,
  parentMuted = false,
  onRoundStart,
}: {
  isPaused?: boolean;
  isAdPlaying?: boolean;
  parentMuted?: boolean;
  onRoundStart?: () => void;
} = {}): UsePairMatchGame {
  const session = useGameSession();
  const board = useGameBoard();
  const shouldPlayBgm = session.status === "playing" && !isPaused && !isAdPlaying;
  const audio = useGameAudio({
    parentMuted,
    paused: isPaused || isAdPlaying,
    shouldPlayBgm,
  });
  const [shuffleNotice, setShuffleNotice] = useState(false);
  const [wrongReason, setWrongReason] = useState<"different-kind" | "blocked-path" | null>(null);
  const [supportStock, setSupportStock] = useState<Record<SupportType, number>>({ hint: 1, shuffle: 1, bomb: 1 });
  const [supportAdUsed, setSupportAdUsed] = useState<Record<SupportType, boolean>>({
    hint: false,
    shuffle: false,
    bomb: false,
  });

  const isSupportLocked = computeSupportLockState(supportStock, supportAdUsed);

  const addSupport = useCallback((type: SupportType) => {
    setSupportStock((prev) => ({ ...prev, [type]: prev[type] + 1 }));
    setSupportAdUsed((prev) => ({ ...prev, [type]: true }));
  }, []);

  const lockRef = useRef(false);
  const wonRef = useRef(false);
  const runIdRef = useRef(0);
  const isPausedRef = useRef(isPaused);
  const scheduledTasksRef = useRef(new Map<number, {
    callback: () => void;
    remaining: number;
    runId: number;
    startedAt: number | null;
    timeoutId: ReturnType<typeof setTimeout> | null;
  }>());
  const nextTaskIdRef = useRef(0);

  const startScheduledTask = useCallback((taskId: number) => {
    const task = scheduledTasksRef.current.get(taskId);
    if (!task || isPausedRef.current || task.timeoutId !== null) return;
    task.startedAt = Date.now();
    task.timeoutId = setTimeout(() => {
      const current = scheduledTasksRef.current.get(taskId);
      if (!current) return;
      if (isPausedRef.current) {
        const pausedAt = Date.now();
        current.remaining = Math.max(0, current.remaining - (pausedAt - (current.startedAt ?? pausedAt)));
        current.timeoutId = null;
        current.startedAt = null;
        return;
      }
      scheduledTasksRef.current.delete(taskId);
      if (runIdRef.current === current.runId) current.callback();
    }, task.remaining);
  }, []);

  const scheduleForCurrentRun = useCallback((callback: () => void, delay: number) => {
    const taskId = nextTaskIdRef.current++;
    scheduledTasksRef.current.set(taskId, {
      callback,
      remaining: delay,
      runId: runIdRef.current,
      startedAt: null,
      timeoutId: null,
    });
    startScheduledTask(taskId);
  }, [startScheduledTask]);

  useEffect(() => {
    isPausedRef.current = isPaused;
    if (isPaused) {
      const pausedAt = Date.now();
      for (const task of scheduledTasksRef.current.values()) {
        if (task.timeoutId === null || task.startedAt === null) continue;
        clearTimeout(task.timeoutId);
        task.remaining = Math.max(0, task.remaining - (pausedAt - task.startedAt));
        task.timeoutId = null;
        task.startedAt = null;
      }
      return;
    }
    for (const taskId of scheduledTasksRef.current.keys()) startScheduledTask(taskId);
  }, [isPaused, startScheduledTask]);

  const invalidateRun = useCallback(() => {
    runIdRef.current += 1;
    for (const task of scheduledTasksRef.current.values()) {
      if (task.timeoutId !== null) clearTimeout(task.timeoutId);
    }
    scheduledTasksRef.current.clear();
    lockRef.current = false;
  }, []);

  useEffect(() => () => {
    for (const task of scheduledTasksRef.current.values()) {
      if (task.timeoutId !== null) clearTimeout(task.timeoutId);
    }
    scheduledTasksRef.current.clear();
  }, []);

  const remainingPairs = getRemainingPairs(board.tiles);

  const selectTile = useCallback(
    (tileId: string) => {
      if (lockRef.current || session.status !== "playing" || isPaused) return;
      const tile = board.tiles.find((t) => t.id === tileId);
      if (!tile || tile.removed) return;

      const next = getSelectedIdsAfterTileTap(board.selectedIds, tileId);
      if (next.length === 0) {
        board.setHintIds([]);
        board.setSelectedIds([]);
        audio.sfx("tap");
        return;
      }

      onRoundStart?.();
      board.setHintIds([]);
      audio.sfx("tap");

      board.setSelectedIds(next);

      if (next.length < 2) return;

      const [firstId, secondId] = next;
      const a = board.tiles.find((t) => t.id === firstId)!;
      const b = board.tiles.find((t) => t.id === secondId)!;
      const { rows, cols } = board;
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
        session.removeLife();

        scheduleForCurrentRun(() => {
          board.setWrongIds([]);
          setWrongReason(null);
          board.setSelectedIds([]);
          lockRef.current = false;
        }, 700);
      }
    },
    [board, session.status, session.level, session.combo, session.addMove, session.addScore, session.addTime, session.increaseCombo, session.resetCombo, session.removeLife, audio.sfx, isPaused, scheduleForCurrentRun, onRoundStart]
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
        const { rows, cols } = board;
        const boardChanged = board.shuffleIfNoMatch(rows, cols);
        if (boardChanged) {
          setShuffleNotice(true);
          audio.sfx("reset"); // play a sound for reshuffle
          scheduleForCurrentRun(() => setShuffleNotice(false), 2000);
        }
      }
    }
  }, [board.tiles, board.rows, board.cols, session.status, session.setWon, board.shuffleIfNoMatch, audio.sfx, scheduleForCurrentRun]);

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
      session.setLost("timeout");
      audio.sfx("timeout");
    }
  }, [session.timeLeft, session.status, session.setLost, audio.sfx]);

  const resetGame = useCallback(() => {
    invalidateRun();
    wonRef.current = false;
    setWrongReason(null);
    setShuffleNotice(false);
    setSupportStock({ hint: 1, shuffle: 1, bomb: 1 });
    setSupportAdUsed({ hint: false, shuffle: false, bomb: false });
    board.resetBoard(1);
    session.resetSession(false);
    audio.sfx("reset");
  }, [invalidateRun, board.resetBoard, session.resetSession, audio.sfx]);

  const nextLevel = useCallback(() => {
    invalidateRun();
    wonRef.current = false;
    setWrongReason(null);
    setShuffleNotice(false);
    setSupportStock({ hint: 1, shuffle: 1, bomb: 1 });
    setSupportAdUsed({ hint: false, shuffle: false, bomb: false });
    board.resetBoard(session.level + 1);
    session.resetSession(true);
    audio.sfx("reset");
  }, [invalidateRun, board.resetBoard, session.level, session.resetSession, audio.sfx]);

  const hintPair = useCallback(() => {
    if (session.status !== "playing" || lockRef.current || isPaused) return;
    perfDiagnostics.count("pikachu.hint.calls");
    onRoundStart?.();
    const scanStartedAt = perfDiagnostics.start("pikachu.hint.scan");
    const { rows, cols } = board;
    const match = findAvailableMatch(board.tiles, rows, cols);
    if (match) {
      board.setHintIds([match.first.id, match.second.id]);
      setSupportStock((prev) => ({ ...prev, hint: prev.hint - 1 }));
      session.addScore(-50); // Penalty for hint
      audio.sfx("tap");
      scheduleForCurrentRun(() => board.setHintIds([]), 1200);
      perfDiagnostics.end("pikachu.hint.scan", scanStartedAt);
      return;
    }
    perfDiagnostics.end("pikachu.hint.scan", scanStartedAt);
  }, [board, session.status, session.addScore, audio.sfx, isPaused, scheduleForCurrentRun, onRoundStart]);

  const shuffleBoard = useCallback(() => {
    if (session.status !== "playing" || lockRef.current || isPaused) return;
    perfDiagnostics.count("pikachu.shuffle.calls");
    onRoundStart?.();
    const { rows, cols } = board;
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
    setSupportStock((prev) => ({ ...prev, shuffle: prev.shuffle - 1 }));
    session.addMove();
    audio.sfx("reset");
    lockRef.current = false;
  }, [board, session.status, session.addMove, audio.sfx, isPaused, onRoundStart]);

  const bombPair = useCallback(() => {
    if (session.status !== "playing" || lockRef.current || isPaused) return;
    onRoundStart?.();
    const { rows, cols } = board;
    const match = findAvailableMatch(board.tiles, rows, cols);
    if (!match) return;

    lockRef.current = true;
    board.setSelectedIds([]);
    board.setWrongIds([]);
    board.setHintIds([]);
    board.setActivePath(match.path);
    setWrongReason(null);
    setSupportStock((prev) => ({ ...prev, bomb: prev.bomb - 1 }));
    session.addScore(-200);
    session.addMove();
    audio.sfx("match");

    scheduleForCurrentRun(() => {
      board.removePair(match.first.id, match.second.id, session.level, rows, cols);
      board.setActivePath(null);
      lockRef.current = false;
    }, 400);
  }, [board, session.status, session.level, session.addMove, session.addScore, audio.sfx, isPaused, scheduleForCurrentRun, onRoundStart]);

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
    lives: session.lives,
    moves: session.moves,
    combo: session.combo,
    timeLeft: session.timeLeft,
    maxTime: session.maxTime,
    remainingPairs,
    status: session.status,
    loseReason: session.loseReason,
    stats: session.stats,
    supportStock,
    supportAdUsed,
    isSupportLocked,
    sfxEnabled: audio.sfxEnabled,
    musicEnabled: audio.musicEnabled,
    setSfxEnabled: audio.setSfxEnabled,
    setMusicEnabled: audio.setMusicEnabled,
    resumeAudioFromUserGesture: audio.resumeFromUserGesture,
    selectTile,
    resetGame,
    nextLevel,
    hintPair,
    shuffleBoard,
    bombPair,
    addSupport,
    revive: session.revive,
    doubleScore: session.doubleScore,
    setLost: session.setLost,
  };
}
