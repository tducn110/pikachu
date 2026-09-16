import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LEADERBOARD_ASSETS } from "../../assets/leaderboardAssets";
import type { ScoreStats } from "../../utils/stats";
import { playSfx } from "../../utils/audio";
import { LeaderboardRow } from "../shared/LeaderboardRow";
import { HyperModal } from "../game/overlays/HyperModal";
import { HyperModalButton } from "../game/ui/HyperModalButton";
import { HyperIcon } from "../game/hyperUi";
import { winkGame } from "../../../integrations/wink/client";
import type { LeaderboardEntry } from "../../../integrations/wink/wink-bridge";

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
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [personalBest, setPersonalBest] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.allSettled([
      winkGame.refreshLeaderboard({ limit: 10 }),
      winkGame.getPersonalBest(),
    ]).then(([lbRes, pbRes]) => {
      if (!active) return;
      if (lbRes.status === "fulfilled" && lbRes.value?.entries) {
        setEntries(lbRes.value.entries);
      }
      if (pbRes.status === "fulfilled" && pbRes.value) {
        setPersonalBest(pbRes.value);
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const handleClose = () => {
    playSfx("close");
    onClose();
  };

  const playerName = winkGame.displayName || t("you", "Bạn");
  const displayScore = personalBest?.score ?? Math.max(stats.best, score);
  const displayRank = personalBest?.rank ? `#${personalBest.rank}` : "—";

  return (
    <HyperModal className="hyper-dashboard-modal" labelledBy="dashboard-title" onRequestClose={handleClose}>
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

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-[var(--game-ink-muted)]">
            <Loader2 className="w-8 h-8 animate-spin text-[#f4771a]" />
            <span className="text-sm font-semibold">{t("loading", "Đang tải...")}</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-[var(--game-ink-muted)]">
            <p className="text-sm font-medium">{t("no_scores_yet", "Chưa có điểm số nào trên bảng xếp hạng.")}</p>
          </div>
        ) : (
          <ol className="leaderboard-list">
            {entries.map((entry, index) => (
              <LeaderboardRow
                key={entry.id || `${entry.rank}-${index}`}
                rank={entry.rank ?? index + 1}
                name={entry.displayName || t("anonymous_player", "Người chơi")}
                score={entry.score}
              />
            ))}
          </ol>
        )}

        <div className="leaderboard-player-row">
          <div className="leaderboard-rank-col">
            <strong className="leaderboard-player-rank">{displayRank}</strong>
          </div>
          <img
            className="leaderboard-avatar leaderboard-avatar--you"
            src={LEADERBOARD_ASSETS.avatars[0]}
            alt=""
            aria-hidden="true"
          />
          <span className="leaderboard-player-you">{playerName}</span>
          <strong className="leaderboard-player-score">{displayScore.toLocaleString("vi-VN")}</strong>
        </div>

        <div className="leaderboard-footer">
          <HyperModalButton
            onClick={handleClose}
            variant="primary"
            className="w-full py-3 sm:py-3.5 shadow-lg"
            sound={false}
          >
            <span className="text-xl font-black uppercase tracking-wide">{t("close", "Đóng")}</span>
          </HyperModalButton>
        </div>
      </section>
    </HyperModal>
  );
}
