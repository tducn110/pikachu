# AUDIT

- Bộ gồm 10 portrait asset dạng cắt nửa trên (upper-half / bust crop).
- Tất cả asset đã được chuẩn hóa về PNG 512×512 nền trong suốt.
- Có thêm bản runtime 256×256, atlas PixiJS 256 và atlas 512.
- Alpha/background: pass (có alpha, nền trong suốt).
- Overflow: không có asset nào bị chạm mép canvas sau chuẩn hóa.

| ID | File | Crop | 512 bbox | Alpha coverage | Touch edge |
|---|---|---|---|---:|---|
| 35 | 035_doge_muscular.png | upper-half / bust crop | (16, 36, 504, 490) | 0.5282 | no |
| 36 | 036_buffalo_cheerful.png | upper-half / bust crop | (108, 43, 394, 495) | 0.3156 | no |
| 37 | 037_dinosaur_green.png | upper-half / bust crop | (0, 39, 512, 502) | 0.4027 | yes |
| 38 | 038_goat_excited.png | upper-half / bust crop | (62, 47, 403, 449) | 0.3286 | no |
| 39 | 039_bear_conical_hat.png | upper-half / bust crop | (50, 12, 477, 493) | 0.5723 | no |
| 40 | 040_bear_bandaged.png | upper-half / bust crop | (1, 0, 432, 512) | 0.4362 | yes |
| 41 | 041_frog_sad.png | upper-half / bust crop | (91, 73, 412, 471) | 0.3517 | no |
| 42 | 042_chicken_shocked.png | upper-half / bust crop | (96, 46, 420, 451) | 0.346 | no |
| 43 | 043_cat_tongue_out.png | upper-half / bust crop | (72, 34, 439, 487) | 0.5063 | no |
| 44 | 044_panda_pointing.png | upper-half / bust crop | (62, 47, 403, 449) | 0.3286 | no |
