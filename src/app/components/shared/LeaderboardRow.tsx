import { LEADERBOARD_ASSETS } from "../../assets/leaderboardAssets";
import { useTranslation } from "react-i18next";

export function LeaderboardRow({
  rank,
  name,
  score,
}: {
  rank: number;
  name: string;
  score: number;
}) {
  const { t, i18n } = useTranslation();
  const medal = rank === 1 ? LEADERBOARD_ASSETS.gold : rank === 2 ? LEADERBOARD_ASSETS.silver : rank === 3 ? LEADERBOARD_ASSETS.bronze : null;
  const avatar = LEADERBOARD_ASSETS.avatars[(rank - 1) % LEADERBOARD_ASSETS.avatars.length];
  const numberLocale = i18n.resolvedLanguage === "vi" ? "vi-VN" : "en-US";

  return (
    <li className="leaderboard-row">
      <div className="leaderboard-rank-col">
        {medal ? (
          <img className="leaderboard-rank leaderboard-rank--medal" src={medal} alt={t("leaderboard_rank", { rank })} />
        ) : (
          <span className="leaderboard-rank-number">{rank}</span>
        )}
      </div>
      <img className="leaderboard-avatar" src={avatar} alt="" aria-hidden="true" />
      <span className="leaderboard-player">{name}</span>
      <strong className="leaderboard-score">{score.toLocaleString(numberLocale)}</strong>
    </li>
  );
}
