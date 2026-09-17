import type { GameStatus } from "../hooks/useGameSession";

/** Only an active round may be paused or resumed. */
export const isPlayableSession = (status: GameStatus): boolean => status === "playing";
