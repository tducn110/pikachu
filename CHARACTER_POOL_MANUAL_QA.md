# CHARACTER_POOL_MANUAL_QA.md

## Combined Character Pool – Manual QA

**Total unique characters: 20**
- Legacy pack: 10 (tile_01–tile_10)
- New 035–044 pack: 10 (legacy:01–legacy:10, new:035–new:044)
- ava1–10: NOT tile characters (1536×1024 layout files, no source reference)

**Board formula:**
```
pairCount = (rows × cols) / 2
activeKinds = min(pairCount, 20)
```

**Expected table:**
| Board | Pairs | Active kinds |
|---|---:|---:|
| 6×6  |  18 | 18 |
| 8×8  |  32 | 20 |
| 10×10 | 50 | 20 |
| 12×12 | 72 | 20 |
| 14×14 | 98 | 20 |
| 16×16 | 128 | 20 |

---

## Checklist

- [ ] Game sử dụng character từ cả old pack và new 035–044 pack
- [ ] Không chỉ còn 8–10 character cũ
- [ ] Không thấy duplicate (ava*.png không xuất hiện là nhân vật)
- [ ] 6×6 dùng 18 loại khác nhau (random mỗi game)
- [ ] 8×8 dùng đủ 20 loại
- [ ] 10×10 dùng đủ 20 loại
- [ ] 12×12, 14×14, 16×16 cũng 20 loại
- [ ] Mỗi board có character selection ngẫu nhiên (chơi lại thấy khác)
- [ ] Phân phối tương đối đều (không con 10 pair, con khác 1 pair)
- [ ] Hai tile cùng character luôn dùng cùng ảnh
- [ ] Shuffle không làm đổi ảnh của kind
- [ ] Reset/new level → character pool có thể thay đổi
- [ ] Không atlas reload khi shuffle
- [ ] Không atlas reload khi level change
- [ ] Không missing texture/404 trong DevTools
- [ ] Không console error
