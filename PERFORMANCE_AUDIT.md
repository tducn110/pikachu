# Pikachu Runtime Audit

Ngày audit: 2026-08-06

## Skills applied

| Skill | Quy tắc đã áp dụng |
|---|---|
| chrome-devtools | Dùng một page Chrome DevTools MCP ổn định để kiểm tra console, network, runtime snapshot và performance trace. |
| browser-testing-with-devtools | Record từng kịch bản riêng, giữ viewport/cache/sequence tương đương khi so sánh. |
| performance-optimization | Đo baseline trước, nối trace với source, chỉ giữ thay đổi có metric hoặc bug evidence. |
| memory-leak-debugging | Chụp heap snapshot sau load, sau 20 và 40 chu kỳ level/reset; so sánh retained object growth. |
| troubleshooting | Khi MCP headful không khởi động được trong môi trường không có X server, chuyển sang Chrome DevTools MCP daemon headless. |
| pixijs-application / pixijs-performance | Kiểm tra `await app.init()`, destroy/removeView, renderer resolution, pool và redraw lifecycle. |
| pixijs-assets / pixijs-events / pixijs-ticker | Kiểm tra atlas cache, texture assignment, hit-area/listener và ticker/lifecycle. |

## Baseline environment

- URL: `http://127.0.0.1:5173/?perf=1`
- Browser: HeadlessChrome 151.0.0.0, Chrome DevTools MCP 1.6.0
- Desktop viewport: 1440x900, DPR 1
- Renderer: WebGL2 (`WebKit WebGL` trong headless environment)
- Canvas: CSS 778x778, physical 778x778
- Canvas count sau clean reload: 1
- Runtime diagnostics: chỉ bật với `?perf=1`; production URL không chạy counters
- Trace storage: `/tmp/pikachu-performance-traces/{baseline,final}/` ngoài Git

## Baseline traces

Đã record riêng A–I trước sửa. D và E có record, nhưng sequence không đạt đủ 5 cặp đúng/3 lượt sai sạch vì board random và timer hết; không dùng chúng để tuyên bố cải thiện chính xác.

| Scenario | Baseline trace | Final trace | Ghi chú |
|---|---|---|---|
| A Initial load | `baseline/trace-a-initial-load.json.gz` | `final/trace-a-initial-load.json.gz` | 4 giây sau reload |
| B First interaction | `baseline/trace-b-first-interaction.json.gz` | `final/trace-b-first-interaction.json.gz` | 2 pointer selection |
| C Normal selection | `baseline/trace-c-normal-selection.json.gz` | `final/trace-c-normal-selection.json.gz` | 10 selection |
| D Correct match | `baseline/trace-d-correct-match.json.gz` | — | Baseline chỉ tái hiện được 3 match |
| E Wrong match | `baseline/trace-e-wrong-match.json.gz` | — | Baseline không đủ 3 wrong sạch |
| F Hint | `baseline/trace-f-hint.json.gz` | `final/trace-f-hint.json.gz` | 3 lần Hint |
| G Shuffle | `baseline/trace-g-shuffle.json.gz` | `final/trace-g-shuffle.json.gz` | 3 lần Shuffle |
| H Resize | `baseline/trace-h-resize.json.gz` | `final/trace-h-resize.json.gz` | 6 viewport changes |
| I Reset/level | `baseline/trace-i-reset-level.json.gz` | `final/trace-i-reset-level.json.gz` | 3 lần Bomb/next level |

## Trace comparison

Các số dưới đây là max event trong raw trace, cùng đơn vị ms; không phải FPS trung bình.

| Scenario | Baseline worst RunTask | Final worst RunTask | Baseline worst Commit | Final worst Commit | Kết quả |
|---|---:|---:|---:|---:|---|
| A Initial load | 84.18 | 84.29 | 64.45 | 64.07 | Tương đương; residual headless startup |
| B First interaction | 57.80 | 57.19 | 28.39 | 0.20 | Cải thiện commit trong sequence này |
| C Normal selection | 66.34 | 56.88 | 61.45 | 29.57 | Commit max giảm 51.9% |
| F Hint | 57.30 | 57.54 | 27.95 | 29.56 | Không cải thiện đáng kể; logic không phải bottleneck đo được |
| G Shuffle | 66.15 | 56.72 | 27.08 | 28.59 | Giảm residual RunTask; không có bằng chứng shuffle validation nặng |
| H Resize | 108.68 | 100.93 | 87.07 | 77.09 | Cải thiện nhưng vẫn còn long tasks trong headless |
| I Reset/level | 97.10 | 52.63 | 31.86 | 29.54 | Giảm max RunTask; pool mở rộng là có chủ đích |

Trace C còn có MajorGC 7.84 → 7.51 ms; trace G 2.38 → 5.93 ms. Vì vậy chưa có bằng chứng để tiếp tục tối ưu allocation/GC mù.

## Console and network

- Clean reload cuối: không có uncaught error, unhandled rejection, missing texture hay Pixi lifecycle error.
- Headless Chrome cảnh báo software WebGL fallback; đây là giới hạn môi trường test, không phải lỗi `app.init()`.
- Baseline có request favicon 404 ngoài phạm vi game; không có asset game bị 404.
- Atlas JSON: 1 request/page session.
- Atlas PNG: 1 request/page session.
- Final clean reload: cả hai atlas request trả 304; shuffle/reset/level không tạo request atlas mới.
- Không thấy asset atlas tải lại do state change.

## Runtime and lifecycle evidence

Snapshot `?perf=1` sau clean reload:

```json
{
  "react.gameBoardRender": 2,
  "pixi.applicationCreated": 1,
  "pikachu.autoShuffleChecks": 1,
  "pixi.boardSync": 2,
  "pixi.tileViewsCreated": 64,
  "pixi.pointerListenersAdded": 64,
  "pixi.positionUpdates": 128,
  "pixi.graphicsRedraws": 64,
  "pixi.textureAssignments": 64
}
```

Sau 20 lần next-level/reset: Application vẫn 1, canvas vẫn 1, pool tối đa 256. TileView/Sprite/Graphics tăng từ 64 lên 256 theo kích thước level, là mở rộng pool hợp lệ chứ không phải leak.

Memory snapshots:

| Snapshot | Retained total | Node count |
|---|---:|---:|
| Baseline idle | 31,618,121 bytes | 512,016 |
| Sau 20 chu kỳ | 35,208,807 bytes | 583,234 |
| Sau 40 chu kỳ | 35,327,167 bytes | 583,715 |

Từ chu kỳ 20 → 40 chỉ tăng khoảng 118 KB/481 nodes; không có tăng tiếp `_Sprite`/`_Graphics` tương ứng. Chưa tái hiện lifecycle leak tuyến tính. Heap không trở về baseline tuyệt đối do pool 256 và JIT/devtools giữ state.

## Root-cause backlog

| ID | Root cause/evidence | Severity | Trạng thái |
|---|---|---:|---|
| R1 | `useGameAudio()` tạo object mới; effect/callback của `usePairMatchGame` phụ thuộc object `audio`, làm kiểm tra/board render lặp khi HUD timer đổi. Instrumentation idle: GameBoard render 15, auto-shuffle check 14. | P1 | Đã sửa |
| R2 | GameBoard không memo; timer/HUD state khiến function component chạy lại dù board không đổi. | P1 | Đã sửa bằng `memo` |
| R3 | `shuffleIfNoMatch` trả `changed` trước khi functional state updater chạy, nên caller có thể nhận `false` dù shuffle sẽ xảy ra. | P2 | Đã sửa; source/typecheck verified, chưa có browser board-no-match tái hiện độc lập |
| R4 | Resize/commit/paint headless có long task; trace H max 108.68 ms baseline. | P1 | Đã đo; chưa thay đổi chất lượng/render mù |
| R5 | Pathfinding, hint scan và shuffle validation không nổi lên là hotspot: sample path total 0 ms; 3 shuffle validation khoảng 0.3 ms. | — | Không sửa |
| R6 | Software WebGL/GPU task/readback warning trong headless. | — | Môi trường, không quy cho app |

## Remaining issues and limits

- Không có thiết bị iOS/Android vật lý hoặc GPU hardware để xác nhận cảm giác tactile/fill-rate thật; mobile mới được emulated ở 390x844 và 844x390, cả hai giữ một canvas.
- D/E chưa có final comparison sạch đủ theo prompt vì board random/timer; không tuyên bố các scenario này đã được chứng minh cải thiện.
- Một số raw trace vẫn có RunTask >50 ms trong headless. Đây là vấn đề còn tồn tại trong môi trường đo, chưa có evidence đủ để quy cho một function game cụ thể.
- Favicon 404 là lỗi ngoài phạm vi gameplay.
