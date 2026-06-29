You are working inside an existing React + TypeScript + Vite mini-game repo.

Read `DESIGN.md` first and follow it strictly.

Build a simple one-screen mini game called:

# Ghép Đôi Bộ Lạc

Game type:
Simple matching-pair game.

Important:
This is NOT a Pikachu/Onet path-connection game.
Do NOT implement pathfinding.
Do NOT implement 40 levels.
Do NOT implement level progression.
Do NOT add backend, auth, ads, shop, inventory, multiplayer, router, TopNav, Footer, Sidebar, or landing page.

The game has only one playable board.

## Core Gameplay

The board contains multiple character tiles.

Each character appears exactly 2 times.

The player taps/selects two tiles.

Rules:

1. If the two selected tiles have the same character, remove the pair.
2. If the two selected tiles are different, show a small wrong feedback, then unselect them.
3. The player wins when all pairs are removed.
4. The player can restart the same board.
5. Optional: track moves, combo, and time.
6. No path rule.
7. No blocked rule.
8. No levels.

## Theme

Use the Bộ Lạc Đậu Phộng design system.

Visual style:

* warm rice paper background
* countryside backdrop
* centered mini-game card
* cream tiles
* orange selected outline
* pencil sketch border
* cute original mascot/character icons
* no pure black
* Be Vietnam Pro font
* mobile portrait first

Do not use Pokémon, Pikachu, copyrighted characters, or external raster assets.

All icons/characters should be drawn with SVG or Pixi Graphics.

## Vietnamese UI Copy

Title:
“Ghép Đôi Bộ Lạc”

Instruction:
“Chọn 2 hình giống nhau”

HUD:

* “Điểm”
* “Lượt”
* “Cặp còn lại”
* “Combo”

Buttons:

* “Chơi lại”
* “Gợi ý”
* “Cài đặt”

Win overlay:

* Title: “Ghép xong rồi!”
* Subtitle: “Bạn đã tìm hết các cặp”
* Buttons: “Chơi lại”, “Bảng điểm”

Wrong match feedback:
“Không giống nhau!”

## Board

Use one fixed board.

Recommended size:

```ts
const BOARD_ROWS = 4;
const BOARD_COLS = 4;
```

This gives 16 tiles = 8 pairs.

If mobile readability is good, 5x4 is acceptable, but prefer 4x4 for the first version.

Tile kinds:

```ts
export type TileKind =
  | "peanut"
  | "cat"
  | "dog"
  | "bamboo"
  | "kite"
  | "stork"
  | "rice"
  | "drum";
```

Each kind appears exactly twice.

Board generation:

* Create pairs from tile kinds.
* Shuffle using a deterministic helper.
* Store tile state: visible/removed/selected.
* The board should be replayable with a new shuffle when pressing “Chơi lại”.

## Required Types

Create or update types:

```ts
export type TileKind =
  | "peanut"
  | "cat"
  | "dog"
  | "bamboo"
  | "kite"
  | "stork"
  | "rice"
  | "drum";

export interface PairTile {
  id: string;
  kind: TileKind;
  row: number;
  col: number;
  removed: boolean;
}
```

## Pure Logic

Create:

`src/utils/pairMatchLogic.ts`

Required functions:

```ts
export function createPairBoard(seed?: number): PairTile[];

export function canMatch(a: PairTile, b: PairTile): boolean;

export function removeMatchedPair(
  tiles: PairTile[],
  firstId: string,
  secondId: string
): PairTile[];

export function getRemainingPairs(tiles: PairTile[]): number;

export function isBoardCleared(tiles: PairTile[]): boolean;

export function shuffleTiles(tiles: PairTile[], seed?: number): PairTile[];
```

Logic rules:

* A tile cannot match itself.
* Removed tiles cannot be selected.
* Two tiles match only if `kind` is the same.
* Board is complete when every tile is removed.

## Tests

Create:

`src/utils/pairMatchLogic.test.ts`

Test:

1. Board has 16 tiles.
2. Board has exactly 8 pairs.
3. Each kind appears exactly twice.
4. Same kind can match.
5. Different kind cannot match.
6. A tile cannot match itself.
7. Removed pair updates state.
8. Remaining pair count works.
9. Board cleared detection works.

## Component Structure

Follow the existing mini-game source style.

Recommended files:

```txt
src/
  components/
    game/
      Game.tsx
      GameBoard.tsx
      GameHUD.tsx
      PairTileIcon.tsx
      Mascot.tsx
      gameThemes.ts

  hooks/
    usePairMatchGame.ts

  utils/
    pairMatchLogic.ts
    pairMatchLogic.test.ts
```

If the existing game files are 2048-specific, replace them safely or add new files first and wire `App.tsx` to the new game.

## Game State Hook

Create:

`src/hooks/usePairMatchGame.ts`

The hook should manage:

* tiles
* selected tile ids
* score
* moves
* combo
* remaining pairs
* status: `"playing" | "won"`
* selectTile(tileId)
* resetGame()
* hintPair()

Selection behavior:

1. First tap selects tile.
2. Second tap checks pair.
3. If same kind:

   * remove both
   * increase score
   * increase combo
   * clear selection
4. If different:

   * show wrong state briefly
   * increase moves
   * reset combo
   * clear selection after short delay

## Scoring

Simple scoring:

* Match pair: +100
* Combo bonus: +20 × combo
* Wrong pair: no score
* Hint use: -50, minimum score 0

No backend.
Use localStorage only for best score / last score / total games.

## UI Layout

Game card:

```txt
GameCard
├── top action buttons
├── title “Ghép Đôi Bộ Lạc”
├── mascot + HUD
├── 4x4 tile board
└── win overlay
```

Board style:

* square board
* 4 columns
* gap 8px
* cream tile background
* rounded corners
* pencil border
* selected tile orange outline
* wrong tile small shake
* matched tile fade/scale out

Tile should show the character/icon clearly.

## Tile Icon Drawing

Create simple SVG or React components for tile icons.

Do not import PNG.

Icon ideas:

* peanut: yellow peanut oval with brown stripe
* cat: orange round face with ears
* dog: golden face with ears
* bamboo: green bamboo stalk
* kite: orange diamond kite
* stork: white bird shape
* rice: rice bundle
* drum: festival drum

Use warm colors from DESIGN.md.

## Audio

Use existing audio flags:

```ts
musicEnabled: boolean;
sfxEnabled: boolean;
```

SFX:

* tap
* match
* wrong
* win
* reset

Never play SFX when `sfxEnabled` is false.

## Accessibility

Requirements:

* Game board aria-label: “Bàn chơi Ghép Đôi Bộ Lạc”
* Tiles should be buttons if rendered in DOM.
* Each tile aria-label should include character type.
* Icon buttons need aria-label.
* Score and remaining pairs should be visible in DOM.
* Touch targets should be large enough on mobile.

## Non-goals

Do not implement:

* Onet/Pikachu path connection
* line drawing between tiles
* 40 levels
* level select
* backend leaderboard
* real login/auth
* ads
* shop
* inventory
* multiplayer
* landing page
* TopNav/Footer/Sidebar

## Implementation Steps

1. Read `DESIGN.md`.
2. Inspect current `src`.
3. Create pair matching pure logic.
4. Add tests for pair matching logic.
5. Create `usePairMatchGame`.
6. Build `Game.tsx`, `GameBoard.tsx`, `GameHUD.tsx`, and `PairTileIcon.tsx`.
7. Wire `App.tsx` to this new game.
8. Preserve the current countryside background and compact mini-game card style.
9. Keep dashboard/settings/leaderboard small.
10. Run:

```bash
npm run build
npm test
```

11. Fix all TypeScript/test errors.
12. Report changed files and tradeoffs.

Final rule:
Protect this loop:

open → choose 2 same icons → remove pair → clear board → restart
