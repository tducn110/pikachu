# 05 — Ponytail review: sử dụng cái đang có, giảm phạm vi

Review này áp dụng nguyên tắc Ponytail vào kế hoạch, không phải đề xuất “viết lại audio/UI”.

## Kết luận

**[D] Hướng nhỏ nhất đúng:**

- Giữ src/app/utils/audio.ts là owner duy nhất của Howler; thêm policy nhỏ thay vì import cả audio manager của Fruit Slashing hay hook 02_2048.
- Giữ useGameAudio.ts làm React bridge; nó không nên trở thành audio engine thứ hai.
- Tái sử dụng HyperModal và visual grammar Settings cho Dashboard, chỉ mở rộng primitive khi một prop scoped thật sự cần.
- Giữ usePairMatchGame.ts sở hữu state transition/scheduler; Game root chỉ compose effective pause.
- Giữ Wink bridge làm adapter đơn giản; không nhúng game rule vào protocol layer.

## Những gì không làm trong đợt sửa

| Không làm | Lý do |
| --- | --- |
| Port nguyên AudioManager Fruit Slashing | Khác output engine Web Audio so với Howler, tăng rủi ro và không chứng minh cần thiết |
| Copy hook audio 02_2048 khoảng 480 dòng | Pikachu cần predicate policy, không cần state machine dài nếu owner hiện có được sửa đúng |
| Thêm Redux/Zustand/context audio mới | State cần truyền qua root/hook hiện có; thêm dependency không giải quyết lifecycle missing |
| Tự động restart BGM mỗi lần focus | Có thể phát ngoài gesture và trái expectation background; Continue là điểm resume rõ ràng |
| Tăng HTML5 pool như cách chữa warning | Che triệu chứng, không xác định vì sao lock/pool xuất hiện trên Safari |
| Đổi board coordinate/Pixi renderer để sửa viewport | Lỗi có bằng chứng là vertical chrome và modal geometry, không phải coordinate gameplay |
| Tạo fake polling leaderboard | Copy refresh phải theo data flow thực, không phải timer trang trí |
| Redesign toàn bộ Hyper UI | Yêu cầu là đồng nhất Dashboard/Settings, đã có hệ Settings để tái sử dụng |

## Candidates theo delete/YAGNI

Không candidate nào bên dưới đã bị xóa. Đây là checklist cho một cleanup patch riêng sau khi feature có tests.

| Mục | Ponytail đánh giá | Điều kiện trước khi xử lý |
| --- | --- | --- |
| Game.tsx: getBoardSize, boardSize, totalPairs | **Delete candidate** — declaration local không có consumer | Xác nhận diff/typecheck sau feature |
| useGameSession.ts: MAX_TIME | **Delete candidate** — constant local không được dùng | Xác nhận nó không là public import |
| DashboardShell và DashboardButton | **YAGNI candidate** — mất lý do tồn tại nếu Dashboard dùng Hyper primitive | Chỉ xóa sau migration, không trước |
| audio.ts: disposed / exports mute helpers | **Consolidate-or-delete candidate** — guard không có setter, helpers không có caller live | Quy định rõ policy API rồi mới xóa |
| Hai declaration .hyper-modal-backdrop | **One-owner candidate** — CSS cascade đang quyết định ownership ngầm | Visual regression tại target viewport trước/sau |
| repomix-output.xml root, tracked Python __pycache__ | **Generated-artifact cleanup candidate** | Tách commit, không trộn vào behavioral repair |

## Cách giữ diff reviewable

1. Patch 1: lifecycle/audio + focused tests. Không chứa UI redesign.
2. Patch 2: shared modal/Dashboard + responsive/i18n + visual screenshots.
3. Patch 3 nếu được duyệt: manifest và cleanup generated/dead code.

Mỗi patch phải có một owner rõ ràng và một acceptance boundary. Nếu audio iPhone cho thấy Howler html5: true không đáp ứng, ghi lại bằng chứng đó rồi mới mở phạm vi đổi audio backend; không làm trước.

## Đánh giá “do it the Ponytail way”

**[A] Source evidence:** đã có audio util, game hook, HyperModal, Wink adapter và i18n module.  
**[C] Inference:** trung tâm vấn đề là lifecycle policy bị thiếu và UI có hai modal owners, không phải thiếu thư viện hay thiếu design system.  
**[D] Recommendation:** thêm một luồng state hợp nhất ở ranh giới app, sửa source owner, sau đó xóa code mất vai trò. Cách này giảm surface regression và giữ gameplay truth tách khỏi polish.

