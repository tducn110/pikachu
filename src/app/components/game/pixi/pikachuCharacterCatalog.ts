/**
 * pikachuCharacterCatalog.ts
 *
 * Single source of truth for ALL unique character assets.
 *
 * AUDIT RESULT (2026-08-07):
 *   Old pack  → 10 unique chars (tile_01 … tile_10), atlas: pikachu_tile_characters_final
 *   New pack  → 9 unique chars (035 … 043),           atlas: pikachu_tile_characters_035_044_half_portrait_final
 *   ava1–10   → 1536×1024 layout images, no source reference → NOT tile characters
 *
 *   `044_panda_pointing.png` is intentionally excluded: it is a byte-for-byte
 *   duplicate of `038_goat_excited.png`, and no correct Panda source exists
 *   in this repository. It must not be reactivated without passing the asset
 *   integrity tests.
 *
 *   TOTAL UNIQUE = 19
 */

export const TILE_ICON_FILL_RATIO = 0.88;
export const PIKACHU_TILE_FRAME_SIZE = 256;

// ─── Atlas URLs (Vite public root, browser-safe) ─────────────────────────────

export const LEGACY_ATLAS_URL =
  "/pikachu_tile_characters_final/atlas/tiles_256.json";

export const NEW_ATLAS_URL =
  "/pikachu_tile_characters_035_044_half_portrait_final/atlas_256/tiles_256.json";

// ─── Character definitions ────────────────────────────────────────────────────

export type CharacterPack = "legacy" | "new";

export interface CharacterDefinition {
  /** Globally unique ID used as tile.kind */
  readonly id: string;
  readonly pack: CharacterPack;
  /** Frame name inside the pack's atlas JSON */
  readonly frame: string;
  readonly label: string;
  /** Optional visual correction for unusually narrow source artwork. */
  readonly iconScaleX?: number;
}

/**
 * Full catalog of currently valid unique characters.
 * Order is stable – IDs never change.
 */
export const PIKACHU_CHARACTERS: readonly CharacterDefinition[] = [
  // ── Legacy pack (10 chars) ──────────────────────────────────────────────────
  { id: "legacy:01", pack: "legacy", frame: "tile_01_troll",            label: "Troll" },
  { id: "legacy:02", pack: "legacy", frame: "tile_02_worried_panda",    label: "Panda lo lắng" },
  { id: "legacy:03", pack: "legacy", frame: "tile_03_boxing_fox",       label: "Cáo boxing" },
  { id: "legacy:04", pack: "legacy", frame: "tile_04_angry_rabbit",     label: "Thỏ giận" },
  { id: "legacy:05", pack: "legacy", frame: "tile_05_sleepy_bear_ball", label: "Gấu ngủ" },
  { id: "legacy:06", pack: "legacy", frame: "tile_06_smug_brown_bear",  label: "Gấu nâu" },
  { id: "legacy:07", pack: "legacy", frame: "tile_07_goofy_tiger",      label: "Hổ ngố" },
  { id: "legacy:08", pack: "legacy", frame: "tile_08_green_gift_mascot",label: "Hộp quà" },
  { id: "legacy:09", pack: "legacy", frame: "tile_09_lion_dance",       label: "Múa lân" },
  { id: "legacy:10", pack: "legacy", frame: "tile_10_goofy_yellow_dragon", label: "Rồng vàng" },
  // ── New 035–044 pack (10 chars) ─────────────────────────────────────────────
  { id: "new:035",   pack: "new",    frame: "035_doge_muscular.png",    label: "Doge cơ bắp" },
  { id: "new:036",   pack: "new",    frame: "036_buffalo_cheerful.png", label: "Buffalo vui vẻ", iconScaleX: 1.17 },
  { id: "new:037",   pack: "new",    frame: "037_dinosaur_green.png",   label: "Khủng long xanh" },
  { id: "new:038",   pack: "new",    frame: "038_goat_excited.png",     label: "Dê hứng khởi" },
  { id: "new:039",   pack: "new",    frame: "039_bear_conical_hat.png", label: "Gấu nón lá" },
  { id: "new:040",   pack: "new",    frame: "040_bear_bandaged.png",    label: "Gấu băng bó" },
  { id: "new:041",   pack: "new",    frame: "041_frog_sad.png",         label: "Ếch buồn" },
  { id: "new:042",   pack: "new",    frame: "042_chicken_shocked.png",  label: "Gà giật mình" },
  { id: "new:043",   pack: "new",    frame: "043_cat_tongue_out.png",   label: "Mèo le lưỡi" },
] as const;

export const TOTAL_UNIQUE_CHARACTERS = PIKACHU_CHARACTERS.length; // 20

/** Quick lookup: characterId → CharacterDefinition */
export const CHARACTER_BY_ID: ReadonlyMap<string, CharacterDefinition> = new Map(
  PIKACHU_CHARACTERS.map((c) => [c.id, c]),
);

// ─── Active pool selection ────────────────────────────────────────────────────

/**
 * Fisher–Yates shuffle using an injected RNG (for deterministic tests).
 */
export function fisherYatesShuffle<T>(arr: readonly T[], rng: () => number): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Pick `count` characters randomly from the full catalog.
 * Returns a new array each call – does NOT mutate PIKACHU_CHARACTERS.
 */
export function selectRandomCharacters(
  count: number,
  rng: () => number,
): CharacterDefinition[] {
  if (count > PIKACHU_CHARACTERS.length) {
    throw new Error(
      `selectRandomCharacters: requested ${count} but catalog only has ${PIKACHU_CHARACTERS.length}`,
    );
  }
  return fisherYatesShuffle(PIKACHU_CHARACTERS, rng).slice(0, count);
}

// ─── Balanced pair distribution ───────────────────────────────────────────────

/**
 * Given a set of active characters and a target pair count,
 * returns an array of character IDs where:
 *   - every active character appears at least once
 *   - extra pairs are distributed as evenly as possible
 *   - max difference between any two characters' pair count is ≤ 1
 *
 * @param activeChars  Characters chosen for this board
 * @param pairCount    Total pairs to fill the board
 * @param rng          Injected RNG for reproducible tests
 */
export function buildBalancedPairKinds(
  activeChars: readonly CharacterDefinition[],
  pairCount: number,
  rng: () => number,
): string[] {
  const n = activeChars.length;
  if (pairCount < n) {
    throw new Error(
      `buildBalancedPairKinds: pairCount (${pairCount}) < activeChars (${n})`,
    );
  }

  const basePairs = Math.floor(pairCount / n);
  const extraPairs = pairCount % n;

  // Shuffle to randomize which chars get the extra pair
  const shuffled = fisherYatesShuffle(activeChars, rng);

  const pairKinds: string[] = [];
  for (let i = 0; i < n; i++) {
    const pairs = basePairs + (i < extraPairs ? 1 : 0);
    for (let p = 0; p < pairs; p++) {
      pairKinds.push(shuffled[i].id);
    }
  }

  return pairKinds;
}

// ─── Board size / active kind count formula ───────────────────────────────────

export function getActiveCharacterCount(rows: number, cols: number): number {
  const pairCount = (rows * cols) / 2;
  return Math.min(pairCount, TOTAL_UNIQUE_CHARACTERS);
}
