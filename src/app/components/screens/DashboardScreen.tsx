import { Clock3, Trophy, UserRound, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LEADERBOARD_ASSETS } from "../../assets/leaderboardAssets";
import type { ScoreStats } from "../../utils/stats";
import { DashboardButton } from "../buttons/DashboardButton";
import { LeaderboardRow } from "../shared/LeaderboardRow";
import { DashboardShell } from "../ui/DashboardShell";

const LEADERBOARD_ENTRIES = [
  ["PikachuMaster", 9875],
  ["BunnyCutie", 8430],
  ["Froggy", 7620],
  ["BearHug", 6210],
  ["ChickenRun", 5910],
  ["PandaPro", 5230],
  ["LuckyCat", 4870],
  ["Hammy", 4560],
  ["DinoBoom", 4120],
  ["PuppyPlay", 3980],
] as const;

export function DashboardScreen({
  score,
  stats,
  onClose,
}: {
  score: number;
  stats: ScoreStats;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="dashboard-backdrop" role="dialog" aria-modal="true" aria-labelledby="dashboard-title">
      <DashboardShell>
        <header className="leaderboard-header">
          <div className="leaderboard-heading">
            <h2 id="dashboard-title">{t("leaderboard", "BẢNG XẾP HẠNG")}</h2>
          </div>
          <DashboardButton onClick={onClose} className="leaderboard-icon-button" aria-label={t("close", "Đóng")}>
            <X size={30} strokeWidth={3} aria-hidden="true" />
          </DashboardButton>
        </header>

        <div className="leaderboard-list-header">
          <Trophy size={30} strokeWidth={2.5} aria-hidden="true" />
          <h3>{t("top_10", "TOP 10")}</h3>
        </div>

        <ol className="leaderboard-list">
          {LEADERBOARD_ENTRIES.map(([name, entryScore], index) => (
            <LeaderboardRow key={name} rank={index + 1} name={name} score={entryScore} />
          ))}
        </ol>

        <div className="leaderboard-player-row">
          <strong>{Math.max(11, Math.min(99, stats.totalGames + 17))}</strong>
          <UserRound size={42} strokeWidth={2.5} aria-hidden="true" />
          <span>{t("you", "Bạn")}</span>
          <strong>{score.toLocaleString("vi-VN")}</strong>
        </div>

        <div className="leaderboard-refresh">
          <Clock3 size={22} strokeWidth={2.5} aria-hidden="true" />
          <span>{t("leaderboard_refresh", "Cập nhật mỗi 30 giây")}</span>
        </div>
      </DashboardShell>
    </div>
  );
}
