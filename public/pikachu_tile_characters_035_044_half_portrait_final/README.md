# README

Gói asset này dùng cho game Pikachu / ghép hình với PixiJS.

## Cấu trúc
- `png_512/`: master PNG 512×512 nền trong suốt
- `runtime_256/`: bản runtime 256×256
- `atlas_256/tiles_256.png + tiles_256.json`: atlas runtime
- `atlas_512/tiles_512.png + tiles_512.json`: atlas chất lượng cao
- `manifest.json`, `AUDIT.md`, `audit.json`
- `preview/contact_sheet.png`

## Gợi ý dùng với PixiJS
```ts
import { Assets, Sprite } from 'pixi.js';
const sheet = await Assets.load('/pikachu_tile_characters_035_044_half_portrait_final/atlas_256/tiles_256.json');
const sprite = new Sprite(sheet.textures['043_cat_tongue_out.png']);
sprite.anchor.set(0.5);
```
