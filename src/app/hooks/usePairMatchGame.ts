import { useCallback, useEffect, useRef, useState } from "react";
import {
  findPikachuPath,
  getBoardSize,
  getRemainingPairs,
  hasAnyMatch,
  isBoardCleared,
  shuffleRemaining,
  buildBoardOccupancy,
  type PairTile,
  type Point,
} from "../utils/pairMatchLogic";
import { useGameAudio } from "./useGameAudio";
import { useGameSession, type GameStatus } from "./useGameSession";
import { useGameBoard } from "./useGameBoard";
import { type ScoreStats } from "../utils/stats";

export interface UsePairMatchGame {
  tiles: PairTile[];
  selectedIds: string[];
  wrongIds: string[];
  wrongReason: "kind" | null;
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
}

export function usePairMatchGame({ isPaused = false }: { isPaused?: boolean } = {}): UsePairMatchGame {
  const audio = useGameAudio();
  const session = useGameSession();
  const board = useGameBoard();
  const [shuffleNotice, setShuffleNotice] = useState(false);

  const lockRef = useRef(false);
  const wonRef = useRef(false);
  const runIdRef = useRef(0);

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
      const path = findPikachuPath(board.tiles, a, b, rows, cols);

      if (path) {
        board.setActivePath(path);
        lockRef.current = true;
        audio.sfx("match");
        const currentRun = runIdRef.current;
        setTimeout(() => {
          if (runIdRef.current !== currentRun) return;
          
          session.increaseCombo();
          const newCombo = session.combo + 1;
          session.addScore(100 + 20 * (newCombo - 1));
          session.addTime(3); // Add 3 seconds for every match
          
          board.removePair(firstId, secondId, session.level, rows, cols);
          board.setSelectedIds([]);
          board.setActivePath(null);
          lockRef.current = false;

          // Checking win via useEffect is better, but we can play sound here
          // Wait, isBoardCleared requires nextTiles. It's handled in useEffect.
        }, 400);
      } else {
        audio.sfx("wrong");
        lockRef.current = true;
        board.setWrongIds([firstId, secondId]);
        session.addMove();
        session.resetCombo();
        
        const currentRun = runIdRef.current;
        setTimeout(() => {
          if (runIdRef.current !== currentRun) return;
          board.setWrongIds([]);
          board.setSelectedIds([]);
          lockRef.current = false;
        }, 700);
      }
    },
    [board, session, audio, isPaused]
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
          setTimeout(() => setShuffleNotice(false), 2000);
        }
      }
    }
  }, [board.tiles, session.status, session.setWon, board.shuffleIfNoMatch, audio]);

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
  }, [session.timeLeft, session.status, session.setLost, audio]);

  const resetGame = useCallback(() => {
    runIdRef.current += 1;
    lockRef.current = false;
    wonRef.current = false;
    
    board.resetBoard(1);
    session.resetSession(false);
    audio.sfx("reset");
  }, [board, session, audio]);

  const nextLevel = useCallback(() => {
    runIdRef.current += 1;
    lockRef.current = false;
    wonRef.current = false;
    
    board.resetBoard(session.level + 1);
    session.resetSession(true);
    audio.sfx("reset");
  }, [board, session, audio]);

  const hintPair = useCallback(() => {
    if (session.status !== "playing" || lockRef.current || isPaused) return;
    const visible = board.tiles.filter((t) => !t.removed);
    const { rows, cols } = getBoardSize(session.level);
    const occupancy = buildBoardOccupancy(board.tiles, rows, cols);
    for (let i = 0; i < visible.length; i++) {
      for (let j = i + 1; j < visible.length; j++) {
        if (findPikachuPath(board.tiles, visible[i], visible[j], rows, cols, occupancy)) {
          board.setHintIds([visible[i].id, visible[j].id]);
          session.addScore(-50); // Penalty for hint
          audio.sfx("tap");
          setTimeout(() => board.setHintIds([]), 1200);
          return;
        }
      }
    }
  }, [board, session, audio, isPaused]);

  const shuffleBoard = useCallback(() => {
    if (session.status !== "playing" || lockRef.current || isPaused) return;
    const { rows, cols } = getBoardSize(session.level);
    lockRef.current = true;
    board.setSelectedIds([]);
    board.setWrongIds([]);
    board.setHintIds([]);
    board.setActivePath(null);
    board.setTiles((prev) => {
      let nextBoard = shuffleRemaining(prev);
      let attempts = 0;
      while (!hasAnyMatch(nextBoard, rows, cols) && attempts < 50) {
        nextBoard = shuffleRemaining(nextBoard);
        attempts += 1;
      }
      return nextBoard;
    });
    session.addMove();
    audio.sfx("reset");
    lockRef.current = false;
  }, [board, session, audio, isPaused]);

  return {
    tiles: board.tiles,
    selectedIds: board.selectedIds,
    wrongIds: board.wrongIds,
    wrongReason: null,
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
  };
}
