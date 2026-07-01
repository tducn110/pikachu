export interface ScoreStats {
  best: number;
  last: number;
  totalGames: number;
}

const STORAGE_KEY = "bolac-pairmatch-stats";

export function loadStats(): ScoreStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ScoreStats;
  } catch {
    /* ignore */
  }
  return { best: 0, last: 0, totalGames: 0 };
}

export function saveStats(stats: ScoreStats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    window.dispatchEvent(new Event("stats-updated"));
  } catch {
    /* ignore */
  }
}
