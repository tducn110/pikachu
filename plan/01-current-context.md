# 01 — Current context và sở hữu hệ thống

## Phạm vi và trạng thái repo

| Mục | Giá trị đã kiểm tra |
| --- | --- |
| Nhánh | main |
| HEAD | ace89909 feat(i18n): add language switcher to pause overlay and set default language |
| Remote | https://github.com/tducn110/pikachu.git |
| Working tree trước artifact review | sạch |
| Thay đổi do review tạo | chỉ plan/ chưa được track |
| Runtime | Vite local tại 127.0.0.1:5178 trong lúc kiểm thử |
| Stack liên quan | React 18.3.1, PixiJS 8.14, Howler 2.2.4, GSAP, i18next |

Package scripts có typecheck, test, build, các gate Wink và Docker headers. Chỉ các check phù hợp với REVIEW_ONLY đã được chạy; chi tiết nằm trong [04-validation-matrix.md](04-validation-matrix.md).

## Bản đồ owner hiện tại

~~~mermaid
flowchart LR
  UI[Game.tsx: Dashboard / Pause / ad prompt]
  Paused[isPaused]
  Hook[usePairMatchGame.ts]
  Session[useGameSession.ts: board, score, timer]
  Board[GameBoard.tsx: Pixi + GSAP effects]
  AudioHook[useGameAudio.ts]
  Audio[utils/audio.ts: Howler BGM/SFX]
  WinkClient[integrations/wink/client.ts]
  WinkBridge[wink-bridge.ts: pause/resume/mute/unmute APIs]

  UI --> Paused
  Paused --> Hook
  Hook --> Session
  Hook --> Board
  Hook --> AudioHook
  AudioHook --> Audio
  WinkBridge --> WinkClient
  WinkClient -. chưa có caller từ Game .-> UI
  Browser[document.hidden / blur / focus] -. chưa có subscriber .-> Paused
  Browser -. chưa có subscriber .-> Audio
~~~

### Luồng game và pause

**[A] src/app/components/game/Game.tsx**  
**ROLE:** root UI của round; sở hữu showPause, showDashboard, adPromptItem và tính isPaused.  
**EVIDENCE:** isPaused = showPause || showDashboard || adPromptItem !== null, sau đó chỉ truyền vào usePairMatchGame; GameBoard không nhận prop pause.  
**ISSUE:** Trạng thái do người dùng mở modal không bao gồm hidden, blur/focus, host pause, host mute.  
**CONFIDENCE:** High.

**[A] src/app/hooks/usePairMatchGame.ts**  
**ROLE:** điều phối input, timer, score, selection và transition của round.  
**EVIDENCE:** effect interval timer dừng khi isPaused; input handlers cũng guard isPaused. scheduleForCurrentRun tạo raw setTimeout cho remove-match, clear-selection và các transition. Callback đã đặt lịch không được gate lại bằng isPaused.  
**ISSUE:** Pause sau khi match đã schedule có thể để transition tiếp tục phía sau overlay.  
**CONFIDENCE:** High.

**[A] src/app/components/game/GameBoard.tsx**  
**ROLE:** render board Pixi và hiệu ứng GSAP như lightning, sparks, combo flash, shake.  
**EVIDENCE:** có ticker render GSAP và các effect/timer riêng; root Game không truyền isPaused vào component.  
**ISSUE:** Có rủi ro hiệu ứng tiếp tục khi pause. Chưa đo frame/timeline để kết luận tất cả animation đều đang chạy ở runtime.  
**CONFIDENCE:** Medium cho hành vi runtime; High cho việc không có pause input.

### Luồng audio hiện tại

~~~text
mount useGameAudio
  -> toggleBgm(musicEnabled && !parentMuted)
  -> Howl.play() [không nằm trong trusted gesture]

pointerdown / keydown bất kỳ
  -> unlockAudio()
  -> resume AudioContext; chỉ thử play nếu musicRequested + bgm đã tồn tại

visibilitychange / blur / focus / Wink pause / Wink mute
  -> không có luồng runtime từ Game đến audio policy
~~~

**[A] src/app/hooks/useGameAudio.ts**  
**ROLE:** expose setting music/SFX và callback phát SFX cho game.  
**EVIDENCE:** mount effect gọi toggleBgm(musicEnabled && !parentMuted); listener global pointerdown/keydown chỉ gọi unlockAudio. Setter music có thể unlock và toggle trong click UI.  
**ISSUE:** BGM được yêu cầu trước first gesture; không có policy hợp nhất cho user preference, forced mute, background và pause.  
**CONFIDENCE:** High.

**[A] src/app/utils/audio.ts**  
**ROLE:** singleton Howler cho BGM/SFX.  
**EVIDENCE:** BGM /BGMM_Lofi2.mp3 tạo với html5: true; toggleBgm(true) resume context rồi track.play(); state musicRequested và sfxEnabled là global. Có export muteAll/unmuteAll, nhưng không tìm thấy caller trong game.  
**ISSUE:** Không có state documentHidden, windowBlurred, hostPaused, hostMuted, hay transition policy. Guard disposed hiện luôn false và không có setter.  
**CONFIDENCE:** High.

**[B] Howler.js** ghi nhận mobile browsers có thể khóa audio cho đến user interaction; phát âm thanh thất bại nên được retry theo unlock event. html5: true sử dụng HTML5 Audio và pool riêng, nên cần kiểm chứng trên Safari thay vì sửa bằng cách tăng pool mặc định. Xem [Howler.js documentation](https://github.com/goldfire/howler.js).

### Ranh giới Wink

**[A] src/integrations/wink/wink-bridge.ts và src/integrations/wink/client.ts**  
**ROLE:** định nghĩa/forward onPause, onResume, onMute, onUnmute; test của client kiểm tra forwarding của adapter.  
**EVIDENCE:** bindLifecycle có contract phù hợp, nhưng truy vết import cho thấy winkGame hiện chỉ được dùng nội bộ client và test; Game không gọi adapter này.  
**ISSUE:** Lifecycle của host chưa vào state game/audio thực tế. Test adapter không chứng minh live game đã bind host.  
**CONFIDENCE:** High.

**[A] wink-integration.json**  
**ROLE:** manifest tuyên bố contract host.  
**EVIDENCE:** khai báo host pause dừng board/input/timers/callbacks mà không reset; host mute chỉ tác động output, không ghi đè user preference. Danh sách source của manifest nhắc useWinkIntegration.ts và useRoundFinalization.ts, hai file không tồn tại trong tracked source hiện tại.  
**ISSUE:** Manifest và code hiện tại lệch nhau; cần cập nhật manifest sau khi implementation đã có integration owner thực.  
**CONFIDENCE:** High.

## Benchmark từ hai game tham chiếu

| Nguồn | Phần đáng học | Không sao chép nguyên khối |
| --- | --- | --- |
| /home/pro/Downloads/intern/onprogress/01_fruit | Tách BGM gain và SFX gain; lưu offset BGM khi pause/resume; preload không tự động phát; handlePlay unlock rồi mới play từ “Chơi ngay”; ứng dụng dừng/resume BGM theo visibility, blur và focus. | Không port AudioBuffer manager nếu Howler của Pikachu đáp ứng được contract sau khi kiểm thử iPhone. |
| /home/pro/Downloads/intern/onprogress/02_2048 | Predicate eligibility tập trung trên user preference + host pause/mute + document hidden + unlock; first gesture retry BGM; App nối host state vào audio policy. | Không copy hook audio khoảng 480 dòng hay thêm second state machine. Pikachu cần policy nhỏ nhất trong audio.ts và useGameAudio.ts. |

Đây là **[C] inference** từ source của các checkout tham chiếu. Không có bằng chứng runtime nào từ Fruit/2048 được dùng để kết luận Pikachu đã đúng trên iPhone.

## UI ownership và i18n

**[A] src/app/components/screens/DashboardScreen.tsx và src/app/components/screens/dashboard.css**  
**ROLE:** modal leaderboard, dữ liệu LEADERBOARD_ENTRIES tĩnh, panel/layout riêng.  
**EVIDENCE:** text “Cập nhật mỗi 30 giây” không có fetch/refetch/interval tương ứng; dùng dashboard-backdrop/dashboard-shell cream/nâu riêng.  
**ISSUE:** Copy ngụ ý leaderboard live, và hệ surface/button khác Settings.  
**CONFIDENCE:** High.

**[A] src/app/components/game/PauseOverlay.tsx và Hyper UI**  
**ROLE:** Settings/pause modal; dùng HyperModal, violet/gold border, Continue pink button và offsetTop.  
**EVIDENCE:** CSS có hai declaration .hyper-modal-backdrop; declaration sau override positioning/z-index của declaration trước. offsetTop dịch modal lên trên.  
**ISSUE:** Cùng một cơ chế modal nhưng có owner CSS trùng lặp; offsetTop tạo clipping trên landscape ngắn.  
**CONFIDENCE:** High.

**[A] src/i18n.ts**  
**ROLE:** i18n resources và initial language.  
**EVIDENCE:** default tiếng Anh; resource có key như leaderboard/score/time/music/sfx nhưng thiếu pause, continue, top_10, you, leaderboard_refresh, open_scores, open_leaderboard, lives_out_of_3. Component fallback có chuỗi tiếng Việt.  
**ISSUE:** Dashboard fresh English hiện “Leaderboard” nhưng vẫn có “Bạn” và “Cập nhật mỗi 30 giây”.  
**CONFIDENCE:** High.

Lưu ý: key persistence fruit-slashing-language là pattern chung đã được sử dụng có chủ ý, không được đổi/bỏ chỉ vì tên key khác Pikachu.

