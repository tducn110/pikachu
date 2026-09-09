# 03 — Kế hoạch implement để xét sau review

Kế hoạch này có chủ ý **không bắt đầu sửa**. Nó chia ownership để đợt implement sau có diff nhỏ, dễ review và test. Thứ tự là để bảo vệ gameplay truth trước polish UI.

## Product contract để chốt

Đây là khuyến nghị mặc định, có thể thay đổi sau input:

| Tình huống | Game | BGM | SFX | UX |
| --- | --- | --- | --- | --- |
| Lần tải đầu, trước interaction | Chưa paused do audio | Không phát | Không phát | First touch/click/key unlock audio; nếu Music đang ON thì mới bật BGM |
| User mở Settings/Pause | Pause toàn bộ gameplay transition | Pause | Suppress | Continue resume từ gesture nếu Music ON |
| document.hidden / window blur | Pause effective | Pause ngay | Suppress ngay | Khi return, giữ Pause overlay với lý do background |
| Host pause | Pause effective | Pause ngay | Suppress ngay | Không reset round; host resume chỉ gọi lại state, không ghi đè user choice |
| Host mute | Gameplay không bắt buộc pause | Im | Im | Nhớ Music/SFX setting của user; unmute sync lại policy |
| User tắt Music | Game tiếp tục | Pause/stop theo policy | Không đổi | Không tự bật lại ở first touch/focus |
| User tắt SFX | Game tiếp tục | Không đổi | Không phát | Không bị host unmute ghi đè |

**Cần xác nhận với user trước phase 3:** Dashboard sẽ là leaderboard Wink live hay leaderboard sample/local. Không nên giả định API hay polling cadence.

## Phase 1 — Lifecycle và audio (ưu tiên P0/P1)

### Luồng target

~~~mermaid
flowchart LR
  Gesture[First valid pointer / key]
  Browser[hidden, blur, focus]
  Host[Wink pause/resume/mute/unmute]
  Local[Pause / Dashboard / ad]
  Policy[Effective policy owner]
  Game[Game effective pause]
  Audio[Howler BGM + SFX]
  Overlay[Pause overlay / Continue]

  Gesture --> Policy
  Browser --> Policy
  Host --> Policy
  Local --> Policy
  Policy --> Game
  Policy --> Audio
  Browser --> Overlay
  Overlay --> Gesture
~~~

### File scope

**FILE:** src/app/components/game/Game.tsx  
**CURRENT RESPONSIBILITY:** compose root display state và truyền local isPaused vào game hook.  
**PROBLEM:** local modal pause là nguồn duy nhất; host/browser lifecycle không đến game.  
**CHANGE:** compose localPaused, host pause và browser/background state thành một effectivePaused; hiện PauseOverlay với reason khi auto-pause. Bind lifecycle adapter ở một app-level owner.  
**WHY:** Game root là điểm duy nhất nhìn thấy modal và gameplay hook; nó không nên biết Howler internals.  
**DO NOT CHANGE:** luật match, score, board coordinate, ad reward semantics.

**FILE:** src/app/hooks/usePairMatchGame.ts  
**CURRENT RESPONSIBILITY:** thực thi round/timer/input và schedule transition.  
**PROBLEM:** raw scheduled callbacks không đồng bộ với isPaused.  
**CHANGE:** đưa scheduler của transition vào một cơ chế có thể freeze/resume theo effectivePaused, hoặc hold pending action an toàn và commit khi resume/run token còn hợp lệ. Test pause giữa match, pause trước clear selection, resume và restart/unmount race.  
**WHY:** Đây là owner của state mutation; Game không nên tự cancel timer của hook.  
**DO NOT CHANGE:** không đổi match timing/điểm/trình tự gameplay trừ khi test chứng minh cần thiết.

**FILE:** src/app/utils/audio.ts  
**CURRENT RESPONSIBILITY:** Howler singleton cho BGM/SFX.  
**PROBLEM:** state rời rạc và play ở mount path; không biết hidden/host pause/mute/unlock.  
**CHANGE:** tạo API policy nhỏ, ví dụ setAudioPolicy và unlockFromUserGesture; policy bao gồm user music/SFX, parent mute, effective pause/background và unlock. BGM chỉ phát khi predicate cho phép. Pause BGM để giữ seek, suppress SFX khi forced mute/pause. Xử lý playerror/unlock theo capability của Howler nếu cần.  
**WHY:** Howler resource và output decision có một owner duy nhất; tránh tách thêm audio manager mới.  
**DO NOT CHANGE:** không thay asset, mix/volume, hay thêm dependency; không đổi html5 mode trước physical Safari evidence.

**FILE:** src/app/hooks/useGameAudio.ts  
**CURRENT RESPONSIBILITY:** kết nối UI setting/callback game với audio util.  
**PROBLEM:** mount effect yêu cầu BGM trước gesture; listener unlock chưa sync lifecycle policy.  
**CHANGE:** bỏ auto-play mount; đăng ký một captured first-interaction unlock/reconcile path, forward preference/parent/effective pause vào audio.ts; setters UI sync ngay trong trusted gesture.  
**WHY:** Hook biết React lifecycle, còn util giữ playback state.  
**DO NOT CHANGE:** không đưa document listener hoặc gameplay mutable state vào Howler util nếu hook có thể own cleanup.

**FILE:** src/integrations/wink/client.ts và app integration owner mới nếu cần tạo  
**CURRENT RESPONSIBILITY:** wrapper API Wink và lifecycle callback.  
**PROBLEM:** contract adapter chưa được compose vào app.  
**CHANGE:** đăng ký một lần, expose hostPaused và parentMuted cho Game; protect against focus event vô tình clear parent pause.  
**WHY:** Bridge chỉ forward host signal; application owner quyết định state UI/game/audio.  
**DO NOT CHANGE:** không đặt Game business logic vào wink-bridge.ts, không thay giao thức host.

**FILE:** src/app/components/game/PauseOverlay.tsx  
**CURRENT RESPONSIBILITY:** Settings/Pause UI.  
**PROBLEM:** không phân biệt manual pause và auto pause do background; offsetTop gây landscape clipping.  
**CHANGE:** nhận optional pause reason, copy i18n, và Continue callback có thể resume từ gesture; bỏ/condition offsetTop.  
**WHY:** nó own thông điệp và CTA, không own lifecycle rule.  
**DO NOT CHANGE:** không thêm audio policy vào UI component.

### Focused tests để thêm/đổi

- Unit test policy: music ON/OFF, SFX ON/OFF, host mute, host pause, hidden, unlock, retry error, và resume permission.
- Hook test: pause trong match scheduled transition; resume giữ đúng state/timing; unmount/restart không commit callback stale.
- Adapter-to-app test: host onPause/onResume/onMute/onUnmute cập nhật state đúng, không reset score/board.

Không cần thêm test framework mới: Vitest đã có.

## Phase 2 — Responsive và một hệ modal UI (sau phase 1)

**FILE:** src/app/components/ui/hyper-ui/HyperModal.tsx, hoặc primitive HyperModal đang thực sự own shell  
**CURRENT RESPONSIBILITY:** shell Settings Hyper.  
**PROBLEM:** Dashboard dùng modal shell riêng dù cùng là overlay; primitive có thể thiếu content slot/class scoped cho leaderboard.  
**CHANGE:** chỉ thêm extension nhỏ như contentClassName/size variant nếu nó giữ Dashboard dùng primitive mà không phá Settings.  
**WHY:** một owner cho backdrop, z-index, dialog geometry, close focus và visual grammar.  
**DO NOT CHANGE:** không redesign Hyper UI hoặc đổi font/palette của cả game.

**FILE:** src/app/components/screens/DashboardScreen.tsx  
**CURRENT RESPONSIBILITY:** render leaderboard dialog, hard-coded entries và custom shell.  
**PROBLEM:** khác visual system, component fallback i18n, static refresh copy.  
**CHANGE:** render trong HyperModal/shared close grammar; content leaderboard chỉ là scoped layout; thay product copy bằng key i18n; bỏ/đổi refresh claim theo quyết định phase 3; bảo đảm dialog focus/close semantics.  
**WHY:** Dashboard và Settings có cùng vai trò modal overlay.  
**DO NOT CHANGE:** không invent live leaderboard data.

**FILE:** src/app/components/screens/dashboard.css và owner hyper-ui.css  
**CURRENT RESPONSIBILITY:** Dashboard layout và modal backdrop styling.  
**PROBLEM:** short landscape overflow; duplicate .hyper-modal-backdrop ownership.  
**CHANGE:** flex column + min-height 0 + list scroll, 100dvh cap, scoped landscape compact rule; hợp nhất backdrop declaration tại một owner.  
**WHY:** CSS geometry cần quy về component primitive own surface/backdrop.  
**DO NOT CHANGE:** không dùng global overflow hidden để che content bị cắt.

**FILE:** layout CSS của Game.tsx hoặc board owner  
**CURRENT RESPONSIBILITY:** mobile header/stat rail/power-up và board sizing.  
**PROBLEM:** 844 x 390 giữ nhiều vertical chrome nên board 106 px cao.  
**CHANGE:** short-landscape query: compact header một hàng, ẩn/di chuyển secondary metadata, giảm bottom controls, cấp priority cho board; thêm visual assertion để board tương tác được.  
**WHY:** board là output chính của game; breakpoint desktop giả tạo không phải cách sửa có bằng chứng.  
**DO NOT CHANGE:** không thay coordinate system của board để sửa CSS.

**FILE:** src/i18n.ts và các component dùng copy thiếu key  
**CURRENT RESPONSIBILITY:** source of truth cho English/Vietnamese text.  
**PROBLEM:** Dashboard/overlay fallback Vietnamese trên default English.  
**CHANGE:** bổ sung key cho pause, continue, top_10, you, leaderboard_refresh nếu giữ, open_scores, open_leaderboard, lives_out_of_3 và keys phát sinh từ implementation; cập nhật cả en/vi.  
**WHY:** text locale phải có một owner.  
**DO NOT CHANGE:** giữ key storage fruit-slashing-language và English default đã được chốt.

**Acceptance UI:** Settings và Dashboard dùng chung backdrop/surface/button hierarchy; 390 x 844 và 844 x 390 không bị clipping; list scroll nội bộ; không còn mixed English/Vietnamese trong một locale.

## Phase 3 — Quyết định leaderboard trước khi code

Có hai lựa chọn khác nhau về scope:

| Lựa chọn | Hành động | Cần user/contract |
| --- | --- | --- |
| A. Không có leaderboard live trong đợt này | Bỏ “Cập nhật mỗi 30 giây”; label rõ sample/local hoặc ẩn panel nếu không có giá trị | Không cần API |
| B. Leaderboard Wink live | Kết nối API/bridge có thật, loading/error/empty state, auth/session, refresh real và tests | Cần contract backend/Wink và ownership data |

Khuyến nghị hiện tại là **A** cho đến khi có contract B. Không có bằng chứng hiện tại cho phép giả định endpoint hay response format.

## Phase 4 — Cleanup nhỏ, patch riêng

Chỉ sau khi Phase 1–2 qua acceptance:

1. Xác nhận reference graph rồi xóa unused declarations/wrappers thật sự.
2. Tách cleanup generated artifacts như repomix-output.xml, tracked Python bytecode thành commit riêng nếu user duyệt.
3. Cập nhật wink-integration.json để khớp integration file và contract đã implement.

Không gộp cleanup với audio/pause patch, để regression có thể truy vết.

