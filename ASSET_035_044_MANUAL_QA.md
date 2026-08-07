# ASSET_035_044_MANUAL_QA.md

## Migration: Bộ character 035–044 → PixiJS Atlas

**Atlas đang dùng:**
```
/pikachu_tile_characters_035_044_half_portrait_final/atlas_256/tiles_256.json
```

---

## ✅ Automated (đã pass)

- [x] typecheck: 0 errors
- [x] tests: 17/17 pass
- [x] build: success
- [x] 10 frame unique (035–044), không duplicate
- [x] Tất cả frame 256×256

---

## 👁️ Visual – người dùng tự kiểm tra

### Nhân vật (mở game, kiểm tra từng loại có xuất hiện)

- [ ] char_035 – Doge cơ bắp (upper-half portrait, không bị kéo dẹt)
- [ ] char_036 – Buffalo vui vẻ
- [ ] char_037 – Khủng long xanh
- [ ] char_038 – Dê hứng khởi
- [ ] char_039 – Gấu nón lá
- [ ] char_040 – Gấu băng bó
- [ ] char_041 – Ếch buồn
- [ ] char_042 – Gà giật mình
- [ ] char_043 – Mèo le lưỡi
- [ ] char_044 – Panda chỉ tay

### Hiển thị

- [ ] Không còn nhân vật pack cũ
- [ ] Không nhân vật nào bị kéo dẹt
- [ ] Không nhân vật nào quá nhỏ trong tile
- [ ] Không crop mất tai/sừng/nón/tay
- [ ] 8×8 nhìn rõ
- [ ] 10×10 nhìn rõ
- [ ] 16×16 vẫn phân biệt được

### Effects

- [ ] Selected highlight vẫn hoạt động
- [ ] Wrong flash vẫn hoạt động
- [ ] Hint vẫn hoạt động
- [ ] Shuffle không đổi sai texture

### Network

- [ ] Không có 404 trong DevTools
- [ ] Atlas chỉ load 1 lần
- [ ] Không console error
