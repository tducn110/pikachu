# PixiJS Tile Asset Manual QA

Điều chỉnh kích thước nhân vật nếu cần bằng constant:

`TILE_ICON_FILL_RATIO = 0.88`

Vị trí constant: `src/app/components/game/pixi/pikachuCharacterCatalog.ts`

Agent không chạy visual smoke test. Người dùng tự mở game và đánh dấu các mục sau.

## Asset loading

- [ ] Không có tile trống
- [ ] Không có icon placeholder cũ
- [ ] Không có request 404
- [ ] Console không có lỗi atlas hoặc texture
- [ ] Không có hai character khác kind nhưng cùng artwork (đặc biệt kiểm tra dê/Panda)

## Tile appearance

- [ ] Nhân vật không bị kéo dẹt
- [ ] Đầu/tai/găng tay/lưỡi không bị crop
- [ ] Các nhân vật có kích thước thị giác tương đối đồng đều
- [ ] Transparent padding không tạo cảm giác nhân vật quá nhỏ
- [ ] Tile 8×8 nhìn rõ
- [ ] Tile 10×10 nhìn rõ
- [ ] Tile 16×16 vẫn phân biệt được nhân vật

## Interaction

- [ ] Bấm được toàn bộ vùng tile
- [ ] Bấm khoảng trống trong tile vẫn nhận
- [ ] Selected state rõ
- [ ] Wrong state rõ
- [ ] Hint đánh dấu đúng hai tile
- [ ] Shuffle giữ đúng ảnh theo kind
- [ ] Matched tile biến mất đúng lúc
- [ ] Không thể click tile đã removed

## Responsive

- [ ] Desktop board fit frame
- [ ] Mobile portrait không crop
- [ ] Mobile landscape không tràn
- [ ] Resize không làm tile lệch
- [ ] Connection path vẫn đi qua tâm tile

## Lifecycle

- [ ] Reload không tạo hai canvas
- [ ] Vào/ra màn hình game không leak canvas
- [ ] Settings/pause khóa input đúng
- [ ] Reset level không load lại atlas
- [ ] Đổi level không nháy placeholder
