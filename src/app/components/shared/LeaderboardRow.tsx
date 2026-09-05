import { LEADERBOARD_ASSETS } from "../../assets/leaderboardAssets";

export function LeaderboardRow({
  rank,
  name,
  score,
}: {
  rank: number;
  name: string;
  score: number;
}) {
  const medal = rank === 1 ? LEADERBOARD_ASSETS.gold : rank === 2 ? LEADERBOARD_ASSETS.silver : rank === 3 ? LEADERBOARD_ASSETS.bronze : null;
  const avatar = LEADERBOARD_ASSETS.avatars[(rank - 1) % LEADERBOARD_ASSETS.avatars.length];

  return (
    <li className="leaderboard-row">
      {medal ? (
        <img className="leaderboard-rank leaderboard-rank--medal" src={medal} alt={`Hạng ${rank}`} />
      ) : (
        <span className="leaderboard-rank-number">{rank}</span>
      )}
      <img className="leaderboard-avatar" src={avatar} alt="" aria-hidden="true" />
      <span className="leaderboard-player">{name}</span>
      <strong className="leaderboard-score">{score.toLocaleString("vi-VN")}</strong>
    </li>
  );
}
