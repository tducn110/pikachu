# Pikachu Performance Fixes

## Fix 1 — loại bỏ rerender/effect work không liên quan board

- Files: `src/app/components/game/GameBoard.tsx`, `src/app/hooks/usePairMatchGame.ts`
- Thay đổi:
  - Bọc `GameBoard` bằng `memo`.
  - Thu hẹp dependency từ object lớn `board/session/audio` sang state, setter và primitive thực sự được dùng.
  - Dùng `audio.sfx` ổn định thay vì toàn bộ object audio mới sau mỗi render.
- Evidence trước: với `?perf=1` và idle 2 giây, `react.gameBoardRender=15`, `pikachu.autoShuffleChecks=14`.
- Evidence sau: `react.gameBoardRender=2`, `pikachu.autoShuffleChecks=1`, Application=1.
- Comparison:
  - Normal selection worst React Commit: 61.45 → 29.57 ms.
  - First interaction worst RunTask: 57.80 → 57.19 ms; residual long task không biến mất hoàn toàn.
- Risk: thấp; không đổi luật matching, board data hoặc HUD.

## Fix 2 — sửa trạng thái trả về của auto-shuffle

- File: `src/app/hooks/useGameBoard.ts`
- Thay đổi: kiểm tra board hiện tại trước khi schedule state update; trả `true` ngay khi đã xác định cần shuffle; functional updater vẫn recheck nếu state đã thay đổi.
- Evidence trước: `changed` chỉ được gán bên trong `setTiles` nhưng return xảy ra ngay sau khi gọi setter; caller có thể đọc `false` trước updater chạy.
- Evidence sau: source flow đã đồng bộ với caller; `pnpm typecheck` pass. Browser không tạo được một board no-match ổn định để tái hiện riêng bug do board random luôn có candidate match trong lần audit.
- Risk: thấp; chỉ sửa thông báo/flow auto-shuffle, không đổi điều kiện match.

## Fix 3 — diagnostics chỉ bật opt-in

- File: `src/app/components/game/pixi/pixiPerfDiagnostics.ts`
- Thay đổi: counters/timings được guard bởi URL `?perf=1`, expose `window.__pikachuPerf` chỉ trong mode audit, không log từng tile và không tạo overhead production đáng kể.
- Đo được: React render, Application/pool/listener counts, board sync/draw, texture assignment, path, hint, shuffle và auto-shuffle.
- Risk: thấp; module không thay đổi game behavior khi không có query flag.

## Validation

- `pnpm typecheck`: pass
- `pnpm test`: pass, 2 files / 15 tests
- `pnpm build`: pass
- `git diff --check`: pass

Không giữ patch nào chỉ vì FPS trung bình. Các trace comparison và raw `.json.gz` nằm ngoài Git tại `/tmp/pikachu-performance-traces/`.
