import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const LANGUAGE_STORAGE_KEY = 'fruit-slashing-language';
type SupportedLanguage = 'vi' | 'en';
const isSupportedLanguage = (value: string | null): value is SupportedLanguage => value === 'vi' || value === 'en';
const getInitialLanguage = (): SupportedLanguage => {
  if (typeof window === 'undefined') return 'vi';
  try { const value = window.localStorage.getItem(LANGUAGE_STORAGE_KEY); return isSupportedLanguage(value) ? value : 'vi'; } catch { return 'vi'; }
};
const persistLanguage = (language: string): void => {
  const normalized = language.split('-')[0];
  if (typeof window === 'undefined' || !isSupportedLanguage(normalized)) return;
  try { window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized); } catch { /* Optional persistence. */ }
};

const resources = {
  vi: {
    translation: {
      game_name: "Pikachu",
      play: "Chơi",
      settings: "Cài đặt",
      leaderboard: "Bảng xếp hạng",
      score: "Điểm",
      best_score: "Kỷ lục",
      level: "Cấp độ",
      time: "Thời gian",
      game_over: "Trò chơi kết thúc",
      revive: "Hồi sinh",
      revive_ad: "Xem quảng cáo để hồi sinh",
      x2_score: "Nhân đôi điểm",
      x2_score_ad: "Xem quảng cáo x2 điểm",
      music: "Nhạc nền",
      sfx: "Âm thanh",
      on: "Bật",
      off: "Tắt",
      language: "Ngôn ngữ",
      loading: "Đang tải...",
      error: "Đã xảy ra lỗi",
      retry: "Thử lại",
      new_record: "Kỷ lục mới!",
      anonymous: "Ẩn danh",
      no_score: "Chưa có điểm nào",
      loading_leaderboard: "Đang tải bảng xếp hạng...",
      close: "Đóng"
    }
  },
  en: {
    translation: {
      game_name: "Pikachu",
      play: "Play",
      settings: "Settings",
      leaderboard: "Leaderboard",
      score: "Score",
      best_score: "Best Score",
      level: "Level",
      time: "Time",
      game_over: "Game Over",
      revive: "Revive",
      revive_ad: "Watch Ad to Revive",
      x2_score: "Double Score",
      x2_score_ad: "Watch Ad for x2 Score",
      music: "Music",
      sfx: "SFX",
      on: "On",
      off: "Off",
      language: "Language",
      loading: "Loading...",
      error: "An error occurred",
      retry: "Retry",
      new_record: "New Record!",
      anonymous: "Anonymous",
      no_score: "No score yet",
      loading_leaderboard: "Loading leaderboard...",
      close: "Close"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    supportedLngs: ['vi', 'en'],
    fallbackLng: "vi",
    interpolation: {
      escapeValue: false
    }
  });
i18n.on('languageChanged', persistLanguage);

export default i18n;
