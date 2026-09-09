# 04 — Bằng chứng đã có và ma trận kiểm thử

## Đã xác minh trong REVIEW_ONLY

| Kiểm tra | Kết quả | Phạm vi chứng minh |
| --- | --- | --- |
| npm run typecheck | Pass | TypeScript của source hiện tại |
| npm test | Pass — 4 files, 49 tests | Unit behavior đã được suite bao phủ |
| npm run verify:wink-bridge | Pass — bridge version 9.0.0, protocol 1, checksum hợp lệ | Artifact/contract bridge được package script kiểm tra |
| git diff --check trước artifact plan | Pass | Không whitespace error trong tracked diff trước review output |
| Chromium local 390 x 844 / 844 x 390 | Chạy và chụp ảnh | Layout/runtime desktop browser tại hai viewport |
| Repomix source snapshot | Pass — 97 textual files | Context source offline tại repomix-source.xml |

## Gate có output nhưng không phải lỗi config đã kết luận

| Lệnh | Output | Diễn giải đúng |
| --- | --- | --- |
| npm run verify:wink-config | WINK_GAME_CONFIG_INCOMPLETE | Script standalone không source game.config.sh; deploy.sh có source file này trước khi chạy gate. Không đủ bằng chứng đây là config production thiếu. |
| npm run verify:docker-headers | GAME_SLUG is required (source ./game.config.sh first) | Cùng nguyên nhân invocation environment. Chưa chạy deploy.sh --check-only vì nó có dirty-tree/build/package behavior và working tree đang có artifact review. |

## Kiểm thử bắt buộc sau implementation

### Audio và lifecycle

| Case | Cách thực hiện | Expected |
| --- | --- | --- |
| First launch, chưa touch | Mở game mới, quan sát BGM/SFX và log | Không audio trước interaction; không autoplay/playerror loop |
| First touch vào board | Touch để chọn tile | Audio context unlock trong gesture; BGM bật nếu Music ON; SFX theo user preference |
| First key | Reload desktop, dùng keyboard | Cùng unlock/sync đúng, không cần pointer |
| Music OFF trước/sau gesture | Toggle, reload khi applicable | Không BGM tự bật lại do focus/unlock |
| SFX OFF | Chọn pair, click UI, trigger error/match | Không SFX, BGM không bị ảnh hưởng |
| Browser hidden | Start round, switch tab/app | BGM pause và SFX bị suppress ngay |
| Browser focus return | Quay lại sau hidden | Pause overlay hiện, không auto phát; Continue resume từ gesture nếu Music ON |
| Window blur/focus | Desktop browser | Giống background policy, không vô tình clear host pause |
| Host pause/resume | Iframe/Wink harness thật | Timer/input/scheduled transitions dừng, không reset round; resume đúng contract |
| Host mute/unmute | Iframe/Wink harness thật | Output im/phục hồi theo user settings, không ghi đè preference |
| Pause giữa match | Bấm Pause trong 400/700 ms transition | Board/score/selection không mutate sau overlay; resume tiếp tục đúng |
| Restart/unmount race | Pause/restart/close gần nhau | Không stale callback, không audio leak/duplicate BGM |
| iPhone Safari | Thiết bị thật, loa/tai nghe, lock-screen/Control Center nếu khả dụng | Xác nhận touch unlock, BGM resume position, background behavior, không pool/locked audio regression |

### UI và responsive

| Viewport / thiết bị | Expected |
| --- | --- |
| 390 x 844 portrait | Board, modal, controls không clip; Dashboard list scroll, Settings và Dashboard cùng visual grammar |
| 844 x 390 landscape | Board cao đủ cho tile thao tác; Settings nằm trọn viewport; Dashboard close/list không bị che |
| 390 x 526 short portrait | dvh và safe area không che CTA/list |
| 768 x 1024 tablet | Modal max size hợp lý, board/touch target không regression |
| 1440 x 900 desktop | Không bị mobile query ảnh hưởng; keyboard/focus dialog đúng |
| iPhone Safari portrait + landscape | Safe area, rotate đang mở Settings/Dashboard, touch and audio acceptance |

### Data và locale

| Case | Expected |
| --- | --- |
| Default English mới | Tất cả copy Dashboard/Pause/Settings là English, không fallback Vietnamese |
| Manual Vietnamese | Tất cả key mới có bản dịch Vietnamese |
| Reload sau đổi language | Giữ lựa chọn vi/en hợp lệ; English vẫn fallback default khi storage invalid |
| Leaderboard source thật | Copy refresh phù hợp data flow; loading/empty/error không nói sai “live” |

## Evidence boundary

**VERIFIED:** source imports, unit/type checks, adapter artifact gate, Chromium runtime geometry và console warning đã ghi nhận.

**NOT VERIFIED:** iPhone Safari, physical touch/audio, iframe host Wink đang chạy, BGM resume seek, actual production leaderboard/API, accessibility screen-reader behavior, FPS/memory profile trên device.

Chromium có một số WebGL ReadPixels performance warning trong headless inspection. Đây là warning của runner/GPU path; chưa có profile để kết luận game có lỗi render/performance.

Passing typecheck/test không thay thế cho các case browser lifecycle, audio physical, host iframe và layout device trong bảng trên.

