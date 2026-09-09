import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LEADERBOARD_ASSETS } from "../../assets/leaderboardAssets";
import type { ScoreStats } from "../../utils/stats";
import { playSfx } from "../../utils/audio";
import { LeaderboardRow } from "../shared/LeaderboardRow";
import { HyperModal } from "../game/overlays/HyperModal";
import { HyperModalButton } from "../game/ui/HyperModalButton";
import { HyperIcon } from "../game/hyperUi";

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

  const handleClose = () => {
    playSfx("click");
    onClose();
  };

  return (
    <HyperModal className="hyper-dashboard-modal" labelledBy="dashboard-title">
      <button
        type="button"
        onClick={handleClose}
        className="leaderboard-close-btn"
        aria-label={t("close", "Đóng")}
        autoFocus
      >
        <X size={18} strokeWidth={3} aria-hidden="true" />
      </button>

      <section className="dashboard-shell">
        <header className="leaderboard-header">
          <div className="leaderboard-icon-badge">
            <HyperIcon name="trophy" className="w-14 h-14 object-contain drop-shadow-md" />
          </div>
          <h2 id="dashboard-title" className="leaderboard-title shadow-text">
            {t("leaderboard", "BẢNG XẾP HẠNG")}
          </h2>
        </header>

        <div className="leaderboard-list-header">
          <span>{t("top_10", "TOP 10")}</span>
          <span>{t("score", "ĐIỂM")}</span>
        </div>

        <ol className="leaderboard-list">
          {LEADERBOARD_ENTRIES.map(([name, entryScore], index) => (
            <LeaderboardRow key={name} rank={index + 1} name={name} score={entryScore} />
          ))}
        </ol>

        <div className="leaderboard-player-row">
          <div className="leaderboard-rank-col">
            <strong className="leaderboard-player-rank">{Math.max(11, Math.min(99, stats.totalGames + 17))}</strong>
          </div>
          <img
            className="leaderboard-avatar leaderboard-avatar--you"
            src={LEADERBOARD_ASSETS.avatars[0]}
            alt=""
            aria-hidden="true"
          />
          <span className="leaderboard-player-you">{t("you", "Bạn")}</span>
          <strong className="leaderboard-player-score">{score.toLocaleString("vi-VN")}</strong>
        </div>

        <div className="leaderboard-footer">
          <HyperModalButton
            onClick={handleClose}
            variant="primary"
            className="w-full py-3 sm:py-3.5 shadow-lg"
          >
            <span className="text-xl font-black uppercase tracking-wide">{t("close", "Đóng")}</span>
          </HyperModalButton>
          <span className="leaderboard-sample-tag">{t("leaderboard_sample", "Điểm mẫu")}</span>
        </div>
      </section>
    </HyperModal>
  );
}
