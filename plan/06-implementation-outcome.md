# 06 — Kết quả implementation 2026-09-08

## Đã thay đổi

| Owner | Thay đổi |
| --- | --- |
| src/app/hooks/useGameLifecycle.ts | Owner mới cho Wink pause/mute và browser visibility, blur, focus. Return từ background hoặc host giữ pause overlay tới khi user bấm Continue. |
| src/app/components/game/Game.tsx | Hợp nhất manual pause, browser state, host state, Dashboard và ad prompt thành effective pause; truyền parent mute vào audio/game; Continue unlock audio trong gesture. |
| src/app/hooks/usePairMatchGame.ts | Scheduled gameplay callbacks giữ phần delay còn lại qua pause; invalidation/unmount hủy task an toàn. |
| src/app/utils/audio.ts + useGameAudio.ts | Thay auto-play mount bằng policy user music/SFX + parent mute + effective pause + unlock. BGM/SFX chỉ phát sau trusted pointer/key hoặc CTA user gesture. |
| src/app/components/game/GameBoard.tsx | Ngừng Pixi render loop khi effective pause. |
| src/app/components/game/overlays/HyperModal.tsx | Modal fixed, dialog semantics, nhận class scoped và labelledBy; bỏ offset positioning. |
| DashboardScreen, dashboard.css, hyper-ui.css | Dashboard dùng HyperModal/visual grammar Settings; list scroll nội bộ; short-landscape compact HUD/modal; không còn custom cream shell. |
| src/i18n.ts | Bổ sung en/vi keys cho Pause, Dashboard, lifecycle message và sample leaderboard. |
| wink-integration.json | Adapter list khớp source hiện tại. |

Dashboard không giả vờ refresh live nữa: copy hiện là “Sample scores” / “Điểm mẫu”. Không có endpoint hay polling giả được thêm.

## Kiểm thử đã thực hiện

| Kiểm tra | Kết quả |
| --- | --- |
| npm run typecheck | Pass |
| npm test | Pass — 4 files, 49 tests |
| npm run build | Pass |
| git diff --check | Pass |
| Chromium 844 x 390 | Board 796 x 306; Settings và Dashboard nằm trong viewport; leaderboard list scroll nội bộ |
| Chromium blur/focus | Blur mở Pause và disable Continue; focus giữ Pause, enable Continue; Continue đóng modal |

## Chưa xác minh

- Physical iPhone Safari audio unlock, backgrounding, BGM seek/resume và landscape safe area.
- Wink iframe/parent production thực. Source binds lifecycle, nhưng bridge phải được cung cấp trước hoặc trong app bootstrap của host.
- SFX/BGM nghe thực tế, volume mix và Howler HTML5 pool behavior trên thiết bị.
- Live leaderboard, vì không có API/data contract được thêm trong scope này.

## Rủi ro còn lại

GSAP timelines có thể tiếp tục tính thời gian nội bộ khi Pixi render bị pause; gameplay state transitions đã được pause ở owner scheduler. Nếu visual effect phải resume đúng frame thay vì chỉ không render khi modal mở, cần profile/điều phối riêng cho từng effect system sau khi có yêu cầu visual acceptance.

