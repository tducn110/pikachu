import { useState } from "react";
import { RotateCcw, Lightbulb, Settings, Volume2, VolumeX, Music, Trophy, X } from "lucide-react";
import { usePairMatchGame } from "../../hooks/usePairMatchGame";
import { CountrysideBackdrop } from "./CountrysideBackdrop";
import { GameBoard } from "./GameBoard";
import { GameHUD } from "./GameHUD";
import { Mascot } from "./Mascot";
import { palette as c } from "./gameThemes";

function ActionButton({
  onClick,
  icon,
  label,
  primary,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex items-center gap-1.5 rounded-full px-4 py-2 transition-shadow"
      style={
        primary
          ? {
              background: "linear-gradient(180deg, #f08a48 0%, #e87432 100%)",
              border: `2px solid ${c.orangeCtaEdge}`,
              color: "#fff",
              fontWeight: 800,
              boxShadow: "0 8px 18px rgba(232,116,50,0.4)",
            }
          : {
              background: "rgba(255,255,255,0.85)",
              border: `2px solid ${c.pencilGray}`,
              color: c.inkDark,
              fontWeight: 700,
            }
      }
    >
      {icon}
      <span style={{ fontSize: 14 }}>{label}</span>
    </button>
  );
}

export function Game() {
  const game = usePairMatchGame();
  const [showSettings, setShowSettings] = useState(false);
  const [showScores, setShowScores] = useState(false);

  return (
    <div
      className="relative size-full min-h-screen overflow-auto flex items-center justify-center p-4"
      style={{ fontFamily: "'Be Vietnam Pro', sans-serif", color: c.inkDark }}
    >
      <CountrysideBackdrop />

      <div
        className="relative w-full max-w-[460px] rounded-3xl p-5"
        style={{
          background: "rgba(253,246,234,0.92)",
          border: `1.5px solid rgba(138,125,101,0.3)`,
          boxShadow: "0 14px 40px rgba(42,36,24,0.18)",
          backdropFilter: "blur(4px)",
        }}
      >
        {/* top action buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <ActionButton
            onClick={game.resetGame}
            icon={<RotateCcw size={16} />}
            label="Chơi lại"
            primary
          />
          <ActionButton
            onClick={game.hintPair}
            icon={<Lightbulb size={16} />}
            label="Gợi ý"
          />
          <ActionButton
            onClick={() => setShowSettings(true)}
            icon={<Settings size={16} />}
            label="Cài đặt"
          />
        </div>

        {/* title + mascot */}
        <div className="mt-4 flex items-center gap-3">
          <Mascot size={64} />
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.1, color: c.inkDark }}>
              Ghép Đôi Bộ Lạc
            </h1>
            <p style={{ fontSize: 14, color: c.pencilGray, marginTop: 2 }}>
              Nối 2 hình giống nhau (đường gấp tối đa 2 góc)
            </p>
          </div>
        </div>

        {/* HUD */}
        <div className="mt-4">
          <GameHUD
            score={game.score}
            moves={game.moves}
            remainingPairs={game.remainingPairs}
            combo={game.combo}
          />
        </div>

        {/* board */}
        <div className="relative mt-4">
          <GameBoard
            tiles={game.tiles}
            selectedIds={game.selectedIds}
            wrongIds={game.wrongIds}
            hintIds={game.hintIds}
            onSelect={game.selectTile}
          />

          {/* wrong feedback toast */}
          {game.wrongIds.length === 2 && (
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full px-4 py-2"
              style={{
                background: c.alertRed,
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                boxShadow: "0 8px 20px rgba(194,56,56,0.4)",
              }}
            >
              {game.wrongReason === "path" ? "Không nối được!" : "Không giống nhau!"}
            </div>
          )}

          {/* win overlay */}
          {game.status === "won" && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Chiến thắng"
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl text-center"
              style={{ background: "rgba(42,36,24,0.55)", animation: "bolac-fade 0.25s" }}
            >
              <div
                className="w-[85%] rounded-3xl px-6 py-6"
                style={{
                  background: c.creamCard,
                  border: `2px solid ${c.mascotYellow}`,
                  boxShadow: "0 14px 40px rgba(42,36,24,0.3)",
                }}
              >
                <Mascot size={72} />
                <h2 style={{ fontSize: 26, fontWeight: 800, marginTop: 8 }}>
                  Ghép xong rồi!
                </h2>
                <p style={{ color: c.pencilGray, marginTop: 4 }}>
                  Bạn đã tìm hết các cặp
                </p>
                <div style={{ marginTop: 8, fontWeight: 700, color: c.orangeCta }}>
                  Điểm: {game.score}
                </div>
                <div className="mt-4 flex justify-center gap-2">
                  <ActionButton
                    onClick={game.resetGame}
                    icon={<RotateCcw size={16} />}
                    label="Chơi lại"
                    primary
                  />
                  <ActionButton
                    onClick={() => setShowScores(true)}
                    icon={<Trophy size={16} />}
                    label="Bảng điểm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* settings modal */}
      {showSettings && (
        <Overlay onClose={() => setShowSettings(false)} title="Cài đặt">
          <ToggleRow
            icon={<Volume2 size={18} />}
            label="Âm thanh hiệu ứng"
            value={game.sfxEnabled}
            onChange={game.setSfxEnabled}
          />
          <ToggleRow
            icon={<Music size={18} />}
            label="Nhạc nền"
            value={game.musicEnabled}
            onChange={game.setMusicEnabled}
          />
        </Overlay>
      )}

      {/* scoreboard modal */}
      {showScores && (
        <Overlay onClose={() => setShowScores(false)} title="Bảng điểm">
          <ScoreRow label="Điểm cao nhất" value={game.stats.best} accent={c.mascotYellow} />
          <ScoreRow label="Điểm gần nhất" value={game.stats.last} accent={c.orangeCta} />
          <ScoreRow label="Số ván đã chơi" value={game.stats.totalGames} accent={c.bambooGreen} />
        </Overlay>
      )}

      <style>{`@keyframes bolac-fade { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </div>
  );
}

function Overlay({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(42,36,24,0.55)", animation: "bolac-fade 0.2s" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[380px] rounded-3xl p-6"
        style={{ background: c.creamCard, border: `2px solid ${c.mascotYellow}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>{title}</h2>
          <button type="button" aria-label="Đóng" onClick={onClose}>
            <X size={20} color={c.pencilGray} />
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-3">{children}</div>
      </div>
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center justify-between rounded-2xl px-4 py-3"
      style={{ background: "rgba(255,255,255,0.7)", border: `1.5px solid rgba(138,125,101,0.3)` }}
    >
      <span className="flex items-center gap-2" style={{ fontWeight: 600 }}>
        {value ? icon : <VolumeX size={18} />}
        {label}
      </span>
      <span
        className="flex h-6 w-11 items-center rounded-full px-0.5 transition-colors"
        style={{ background: value ? c.orangeCta : c.pencilGray }}
      >
        <span
          className="h-5 w-5 rounded-full bg-white transition-transform"
          style={{ transform: value ? "translateX(20px)" : "translateX(0)" }}
        />
      </span>
    </button>
  );
}

function ScoreRow({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div
      className="flex items-center justify-between rounded-2xl px-4 py-3"
      style={{ background: "rgba(255,255,255,0.7)", border: `1.5px solid rgba(138,125,101,0.3)` }}
    >
      <span style={{ fontWeight: 600, color: c.pencilGray }}>{label}</span>
      <span style={{ fontWeight: 800, fontSize: 22, color: accent }}>{value}</span>
    </div>
  );
}
