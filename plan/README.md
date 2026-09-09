# Pikachu — hồ sơ review và kế hoạch sửa

**Ngày lập:** 2026-09-08 (Asia/Ho_Chi_Minh)  
**Chế độ:** REVIEW_ONLY — không sửa mã nguồn game, không commit, không deploy.  
**Checkout:** /home/pro/Downloads/intern/onprogress/06_pikachu  
**HEAD đã kiểm tra:** ace89909 feat(i18n): add language switcher to pause overlay and set default language

Thư mục này là bộ hồ sơ để truy vết và thực hiện đợt sửa sau khi chốt quyết định sản phẩm. Nó gồm source snapshot, bằng chứng source/runtime, kế hoạch sửa theo owner, và ma trận kiểm thử.

## Mục lục

| Tài liệu | Nội dung |
| --- | --- |
| [01-current-context.md](01-current-context.md) | Repo, kiến trúc đang chạy, luồng pause/audio và ranh giới Wink |
| [02-findings.md](02-findings.md) | Phát hiện có bằng chứng, mức độ, triệu chứng và nguyên nhân |
| [03-implementation-plan.md](03-implementation-plan.md) | Kế hoạch sửa nhỏ nhất theo phase và file cụ thể |
| [04-validation-matrix.md](04-validation-matrix.md) | Lệnh đã chạy, kiểm thử cần chạy sau sửa và giới hạn bằng chứng |
| [05-ponytail-review.md](05-ponytail-review.md) | Đánh giá Ponytail: tái sử dụng, delete/YAGNI và ranh giới không nên refactor |
| [06-implementation-outcome.md](06-implementation-outcome.md) | Phạm vi đã implement, kiểm thử đã chạy và acceptance còn mở |
| [repomix-source.xml](repomix-source.xml) | Snapshot mã nguồn bằng Repomix, có line number, để tra cứu offline |
| [screenshots/](screenshots/) | Ảnh runtime tại mobile dọc và mobile ngang |

## Kết luận cần xử lý trước

1. **Pause hiện chưa là pause toàn diện.** isPaused chặn input và timer, nhưng các setTimeout đã đặt lịch để xử lý match/clear vẫn có thể chạy sau lớp Pause. Pixi/GSAP effects cũng chưa nhận trạng thái pause.
2. **Audio chưa có policy lifecycle.** BGM được yêu cầu chạy lúc mount; không có owner theo dõi visibility, focus hay Wink lifecycle. Adapter Wink có API lifecycle nhưng Game chưa đăng ký sử dụng nó.
3. **Mobile ngang 844 x 390 bị vỡ layout.** Vùng board chỉ còn cao 106 px; Settings bị cắt phía trên; danh sách Dashboard tràn xuống ngoài card.
4. **Dashboard và Settings dùng hai hệ UI.** Settings dùng Hyper UI violet/gold; Dashboard dùng panel cream/nâu riêng. Đồng thời Dashboard có text tiếng Việt fallback trong khi ứng dụng mặc định tiếng Anh.
5. **Leaderboard đang là dữ liệu tĩnh.** Copy “Cập nhật mỗi 30 giây” không có fetch hay interval tương ứng. Không nên trình bày nó như bảng xếp hạng live.

## Cách đọc mức độ bằng chứng

- **[A] Source evidence:** đọc trực tiếp từ source, package script, hoặc output lệnh.
- **[B] Official documentation:** tài liệu chính thức của dependency.
- **[C] Inference:** kết luận kỹ thuật cần được kiểm chứng thêm.
- **[D] Recommendation:** hướng sửa để chốt sau review.

Danh sách “chưa xác minh” không phải phán đoán lỗi. Nó chỉ đánh dấu các hành vi cần browser, iframe host, hoặc iPhone Safari thực để kết luận.

## Snapshot Repomix

Tạo bằng lệnh:

~~~bash
npx repomix . --output plan/repomix-source.xml \
  --ignore 'plan/**,repomix-output.xml' \
  --output-show-line-numbers --parsable-style
~~~

Kết quả: 97 tệp text, 160,813 tokens, 494,467 ký tự source; bundle đầu ra 499,913 bytes. Lệnh chủ động loại plan để tránh tự đóng gói lại chính bundle này, và loại repomix-output.xml cũ ở root để snapshot không bị lặp/quá lớn.

## Ảnh runtime đã chụp

| Viewport | Game | Settings | Dashboard |
| --- | --- | --- | --- |
| 390 x 844 | [game](screenshots/game-390x844.png) | [settings](screenshots/settings-390x844.png) | [dashboard](screenshots/dashboard-390x844.png) |
| 844 x 390 | [game](screenshots/game-844x390.png) | [settings](screenshots/settings-844x390.png) | [dashboard](screenshots/dashboard-844x390.png) |

Ảnh được chụp trên Chromium local, không phải bằng chứng iPhone Safari hay host Wink thực.
