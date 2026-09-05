export const LEADERBOARD_ASSETS = Object.freeze({
  gold: "/leaderboard/rank-gold.webp",
  silver: "/leaderboard/rank-silver.webp",
  bronze: "/leaderboard/rank-bronze.webp",
  avatars: Array.from({ length: 10 }, (_, index) => `/leaderboard/avatar-${String(index + 1).padStart(2, "0")}.webp`),
});
