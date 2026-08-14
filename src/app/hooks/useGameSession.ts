import { useState, useCallback } from "react";
import { type ScoreStats, loadStats, saveStats } from "../utils/stats";
import { getBoardSize, MAX_BOARD_LEVEL } from "../utils/pairMatchLogic";

export type GameStatus = "playing" | "won" | "lost" | "revive";
export type LoseReason = "timeout" | "no_lives";

const MAX_TIME = 90; // 90 seconds max

export function useGameSession() {
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [combo, setCombo] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [hasRevived, setHasRevived] = useState(false);
  
  const getLevelMaxTime = (level: number) => {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
  const { rows, cols } = getBoardSize(level, isMobile);
  const pairs = (rows * cols) / 2;
  // Dynamic time scaling based on number of pairs and level
  return Math.max(45, Math.floor(pairs * 3) + Math.max(0, 30 - level));
};
  
  const currentMaxTime = getLevelMaxTime(level);
  
  const [timeLeft, setTimeLeft] = useState(currentMaxTime);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [loseReason, setLoseReason] = useState<LoseReason | null>(null);
  const [stats, setStats] = useState<ScoreStats>(() => loadStats());

  const addScore = useCallback((points: number) => {
    setScore((s) => Math.max(0, s + points));
  }, []);

  const addMove = useCallback(() => {
    setMoves((m) => m + 1);
  }, []);

  const resetCombo = useCallback(() => {
    setCombo(0);
  }, []);

  const increaseCombo = useCallback(() => {
    setCombo((c) => c + 1);
  }, []);

  const addTime = useCallback((seconds: number) => {
    setTimeLeft((t) => Math.min(currentMaxTime, t + seconds));
  }, [currentMaxTime]);

  const tickTime = useCallback((dt: number) => {
    setTimeLeft((t) => {
      const next = t - dt;
      return next > 0 ? next : 0;
    });
  }, []);

  const setWon = useCallback(() => {
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
  }, [score]);

  const setLost = useCallback((reason: LoseReason) => {
    setLoseReason(reason);
    setStatus("lost");
    setStats((prev) => {
      const updated: ScoreStats = {
        best: Math.max(prev.best, score),
        last: score,
        totalGames: prev.totalGames + 1,
      };
      saveStats(updated);
      return updated;
    });
  }, [score]);
  const removeLife = useCallback(() => {
    setLives((l) => {
      const next = Math.max(0, l - 1);
      if (next === 0) {
        if (hasRevived) {
          setTimeout(() => {
            setLost("no_lives");
          }, 0);
        } else {
          setStatus("revive");
        }
      }
      return next;
    });
  }, [hasRevived, setLost]);

  const revive = useCallback((hearts: number) => {
    setLives(hearts);
    setHasRevived(true);
    setStatus("playing");
  }, []);

  const doubleScore = useCallback(() => {
    setScore((s) => {
      const next = s * 2;
      setStats((prev) => {
        const updated: ScoreStats = {
          ...prev,
          best: Math.max(prev.best, next),
          last: next,
        };
        saveStats(updated);
        return updated;
      });
      return next;
    });
  }, []);

  const resetSession = useCallback((isNextLevel = false) => {
    const nextLevelNum = isNextLevel ? Math.min(level + 1, MAX_BOARD_LEVEL) : 1;
    if (!isNextLevel) {
      setScore(0);
      setLevel(1);
    } else {
      // Level 5 is the documented repeatable 16×16 final challenge.
      setLevel(nextLevelNum);
    }
    setMoves(0);
    setCombo(0);
    setLives(3);
    setLoseReason(null);
    setHasRevived(false);
    const newMaxTime = getLevelMaxTime(nextLevelNum);
    setTimeLeft(newMaxTime);
    setStatus("playing");
  }, [level]);

  return {
    score,
    moves,
    combo,
    level,
    lives,
    timeLeft,
    maxTime: currentMaxTime,
    status,
    loseReason,
    stats,
    addScore,
    addMove,
    resetCombo,
    increaseCombo,
    addTime,
    tickTime,
    setWon,
    setLost,
    removeLife,
    revive,
    doubleScore,
    resetSession,
    setStatus,
  };
}
