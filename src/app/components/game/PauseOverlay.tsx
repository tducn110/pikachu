import React from "react";
import { useTranslation } from "react-i18next";
import { Languages, Play, Volume2, VolumeX, Music } from "lucide-react";
import i18n from "../../../i18n";
import { playSfx } from "../../utils/audio";
import { HyperIcon } from "./hyperUi";
import { HyperModal } from "./overlays/HyperModal";
import { HyperModalButton } from "./ui/HyperModalButton";
import type { PauseReason } from "../../hooks/useGameLifecycle";

export function PauseOverlay({
  onClose,
  sfxEnabled,
  musicEnabled,
  setSfxEnabled,
  setMusicEnabled,
  pauseReason,
  canContinue,
}: {
  onClose: () => void;
  sfxEnabled: boolean;
  musicEnabled: boolean;
  setSfxEnabled: (v: boolean) => void;
  setMusicEnabled: (v: boolean) => void;
  pauseReason: PauseReason | null;
  canContinue: boolean;
}) {
  const { t } = useTranslation();
  const currentLanguage = i18n.resolvedLanguage === "vi" ? "vi" : "en";
  const nextLanguage = currentLanguage === "en" ? "vi" : "en";

  const toggleLanguage = () => {
    playSfx("toggle");
    void i18n.changeLanguage(nextLanguage);
  };

  return (
    <HyperModal labelledBy="pause-title" onRequestClose={canContinue ? onClose : undefined}>
      <h2 id="pause-title" className="text-3xl font-black text-[var(--hyper-purple-ink)] uppercase mb-3 mt-2 shadow-text">
        {t("pause", "TẠM DỪNG")}
      </h2>
      {pauseReason && (
        <p className="mb-4 text-center text-sm font-bold text-[var(--hyper-purple-ink)]">
          {pauseReason === "host"
            ? t("pause_host", "Game đang tạm dừng bởi hệ thống.")
            : t("pause_background", "Game đã tạm dừng khi bạn rời khỏi màn hình.")}
        </p>
      )}

      <div className="w-full mb-4">
          <HyperModalButton
          onClick={() => { playSfx("click"); onClose(); }}
          sound={false}
          variant="primary"
          className="py-4"
          disabled={!canContinue}
        >
          <div className="flex items-center gap-2">
            <Play size={24} strokeWidth={3} />
            <span className="text-xl">{t("continue", "TIẾP TỤC")}</span>
          </div>
        </HyperModalButton>
      </div>
      {!canContinue && (
        <p className="mb-3 text-center text-sm font-bold text-[var(--hyper-purple-ink)]">
          {pauseReason === "host"
            ? t("pause_waiting_host", "Đợi hệ thống tiếp tục game để chơi tiếp.")
            : t("pause_waiting_background", "Quay lại cửa sổ game để tiếp tục.")}
        </p>
      )}

      <div className="flex w-full justify-center sm:justify-between gap-3 sm:gap-4 mt-2 px-0 sm:px-2">
        <button
          type="button"
          className={`flex flex-col items-center gap-1 transition-transform active:scale-95 ${!sfxEnabled ? 'opacity-50 grayscale' : 'opacity-90 hover:opacity-100'}`}
          onClick={() => {
            const next = !sfxEnabled;
            if (!next) {
              playSfx("toggle");
              setSfxEnabled(false);
            } else {
              setSfxEnabled(true);
              playSfx("toggle");
            }
          }}
          aria-pressed={sfxEnabled}
          aria-label={`${t("sfx", "Âm thanh")}: ${sfxEnabled ? t("on", "Bật") : t("off", "Tắt")}`}
        >
          <div className="w-14 h-14 rounded-full bg-[var(--hyper-gold)] flex items-center justify-center shadow-lg border-2 border-[var(--hyper-brown)]">
            {sfxEnabled ? (
              <Volume2 size={26} strokeWidth={3} className="text-[var(--hyper-brown)]" />
            ) : (
              <VolumeX size={26} strokeWidth={3} className="text-[var(--hyper-brown)]" />
            )}
          </div>
          <span className="text-[var(--hyper-purple-ink)] font-bold text-sm">{t("sfx", "Âm thanh")}</span>
        </button>

        <button
          type="button"
          className={`flex flex-col items-center gap-1 transition-transform active:scale-95 ${!musicEnabled ? 'opacity-50 grayscale' : 'opacity-90 hover:opacity-100'}`}
          onClick={() => { playSfx("toggle"); setMusicEnabled(!musicEnabled); }}
          aria-pressed={musicEnabled}
          aria-label={`${t("music", "Nhạc nền")}: ${musicEnabled ? t("on", "Bật") : t("off", "Tắt")}`}
        >
          <div className="w-14 h-14 rounded-full bg-[var(--hyper-gold)] flex items-center justify-center shadow-lg border-2 border-[var(--hyper-brown)]">
            <Music size={26} strokeWidth={3} className="text-[var(--hyper-brown)]" />
          </div>
          <span className="text-[var(--hyper-purple-ink)] font-bold text-sm">{t("music", "Nhạc nền")}</span>
        </button>

        <button
          type="button"
          className="flex flex-col items-center gap-1 transition-transform active:scale-95 opacity-90 hover:opacity-100"
          onClick={toggleLanguage}
          aria-label={t("change_language", "Change language")}
        >
          <div className="w-14 h-14 rounded-full bg-[var(--hyper-gold)] flex items-center justify-center shadow-lg border-2 border-[var(--hyper-brown)]">
            <Languages size={26} strokeWidth={3} className="text-[var(--hyper-brown)]" />
          </div>
          <span className="text-[var(--hyper-purple-ink)] font-bold text-sm uppercase" aria-live="polite">
            {currentLanguage}
          </span>
        </button>
      </div>
    </HyperModal>
  );
}
