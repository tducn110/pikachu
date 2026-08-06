# Pikachu Manual Recheck

URL audit tùy chọn: `http://127.0.0.1:5173/?perf=1`.

- [ ] Initial load: board hiện đủ, không canvas trùng.
- [ ] First click: click tile đầu và tile thứ hai; kiểm tra input không bị trễ.
- [ ] 10 normal selections: đổi tile đang selected và click nhanh vừa phải.
- [ ] 5 correct matches: đường nối đi đúng tâm, tile biến mất sau animation, score/combo đúng.
- [ ] 3 wrong matches: wrong state tự reset, input trở lại bình thường.
- [ ] Hint 3 lần: pair được highlight đúng, hint không giữ mãi, penalty đúng.
- [ ] Shuffle 3 lần: tile/icon không nhấp nháy sai, board vẫn chơi được, không request atlas mới.
- [ ] Reset: state, timer, selected/wrong/hint/path và score trở về đúng trạng thái.
- [ ] Level change: 8x8 → các level lớn hơn, không tạo canvas/Application thứ hai.
- [ ] Resize desktop ↔ cửa sổ nhỏ 5–10 lần: board vẫn nằm trong canvas, không feedback loop.
- [ ] Mobile portrait 390x844.
- [ ] Mobile landscape 844x390.
- [ ] Cảm giác input khi chọn, match, wrong match và shuffle.
- [ ] Animation: line/path không còn sau khi kết thúc, không có stale visual state.
- [ ] Audio nếu có: SFX/BGM vẫn đúng lifecycle sau reset/level.
- [ ] Console: không có uncaught error, unhandled rejection, missing texture hoặc asset 404.
- [ ] Network: atlas JSON/PNG chỉ tải một lần mỗi page session; reset/shuffle không tải lại.

## Ghi nhận thủ công

- Thiết bị/browser:
- Viewport/DPR:
- Scenario lỗi:
- Expected:
- Actual:
- Screenshot/trace:
