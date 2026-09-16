import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const LANGUAGE_STORAGE_KEY = 'pikachu-language';
type SupportedLanguage = 'vi' | 'en';
const isSupportedLanguage = (value: string | null): value is SupportedLanguage => value === 'vi' || value === 'en';
const getInitialLanguage = (): SupportedLanguage => {
  if (typeof window === 'undefined') return 'en';
  try {
    const value = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isSupportedLanguage(value)) return value;
  } catch {
    // Storage read failure fallback
  }
  // Contract: Wink-hosted initial language = Wink.locale if supported, otherwise English.
  const winkLocale = (window as any).Wink?.locale;
  if (typeof winkLocale === 'string') {
    const normalized = winkLocale.split('-')[0];
    if (isSupportedLanguage(normalized)) return normalized;
  }
  return 'en';
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
      change_language: "Đổi ngôn ngữ",
      loading: "Đang tải...",
      error: "Đã xảy ra lỗi",
      retry: "Thử lại",
      new_record: "Kỷ lục mới!",
      anonymous: "Ẩn danh",
      no_score: "Chưa có điểm nào",
      loading_leaderboard: "Đang tải bảng xếp hạng...",
      close: "Đóng",
      pause: "Tạm dừng",
      continue: "Tiếp tục",
      top_10: "Top 10",
      you: "Bạn",
      open_scores: "Mở bảng điểm",
      open_leaderboard: "Mở bảng xếp hạng",
      lives_out_of_3: "trên 3 lượt",
      pause_background: "Game đã tạm dừng khi bạn rời khỏi màn hình.",
      pause_host: "Game đang tạm dừng bởi hệ thống.",
      pause_waiting_host: "Đợi hệ thống tiếp tục game để chơi tiếp.",
      pause_waiting_background: "Quay lại cửa sổ game để tiếp tục.",
      leaderboard_sample: "Điểm mẫu",
      hint: "Gợi ý",
      shuffle: "Đảo",
      bomb: "Bom",
      add_item: "THÊM",
      plus_1_turn: "+1 lượt",
      plus_1_turn_caps: "+1 LƯỢT",
      watch_ad: "XEM QUẢNG CÁO",
      maybe_later: "Để sau",
      time_up: "HẾT THỜI GIAN!",
      you_lose: "BẠN ĐÃ THUA!",
      score_upper: "ĐIỂM",
      play_again: "CHƠI LẠI",
      revive_upper: "HỒI SINH",
      give_up: "Bỏ cuộc",
      completed: "HOÀN THÀNH!",
      x2_score_upper: "X2 ĐIỂM",
      pikachu_board: "Bàn chơi Ghép đôi Pikachu",
      error_loading_assets: "Không thể tải asset bàn chơi:",
      loading_characters: "Đang tải...",
      locked: "Đã khóa"
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
      change_language: "Change language",
      loading: "Loading...",
      error: "An error occurred",
      retry: "Retry",
      new_record: "New Record!",
      anonymous: "Anonymous",
      no_score: "No score yet",
      loading_leaderboard: "Loading leaderboard...",
      close: "Close",
      pause: "Paused",
      continue: "Continue",
      top_10: "Top 10",
      you: "You",
      open_scores: "Open scores",
      open_leaderboard: "Open leaderboard",
      lives_out_of_3: "of 3 lives",
      pause_background: "The game paused while you were away.",
      pause_host: "The game is paused by the host.",
      pause_waiting_host: "Waiting for the host to resume the game.",
      pause_waiting_background: "Return to the game window to continue.",
      leaderboard_sample: "Sample scores",
      hint: "Hint",
      shuffle: "Shuffle",
      bomb: "Bomb",
      add_item: "ADD",
      plus_1_turn: "+1 turn",
      plus_1_turn_caps: "+1 TURN",
      watch_ad: "WATCH AD",
      maybe_later: "Maybe later",
      time_up: "TIME'S UP!",
      you_lose: "YOU LOSE!",
      score_upper: "SCORE",
      play_again: "PLAY AGAIN",
      revive_upper: "REVIVE",
      give_up: "Give Up",
      completed: "COMPLETED!",
      x2_score_upper: "X2 SCORE",
      pikachu_board: "Pikachu Match Board",
      error_loading_assets: "Failed to load board assets:",
      loading_characters: "Loading...",
      locked: "Locked"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    supportedLngs: ['vi', 'en'],
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });
i18n.on('languageChanged', persistLanguage);

if (typeof window !== 'undefined' && (window as any).Wink?.on) {
  try {
    (window as any).Wink.on('locale', (locale: string) => {
      const normalized = locale?.split('-')[0];
      if (isSupportedLanguage(normalized)) {
        void i18n.changeLanguage(normalized);
      }
    });
  } catch {
    // Non-fatal listener registration
  }
}

export default i18n;
