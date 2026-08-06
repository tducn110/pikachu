import type { TileKind } from "../../../utils/pairMatchLogic";

/** A single place to tune the visual fill of the square character canvas. */
export const TILE_ICON_FILL_RATIO = 0.88;

export const PIKACHU_TILE_FRAME_SIZE = 256;

export const PIKACHU_TILE_FRAME_NAMES = [
  "tile_01_troll",
  "tile_02_worried_panda",
  "tile_03_boxing_fox",
  "tile_04_angry_rabbit",
  "tile_05_sleepy_bear_ball",
  "tile_06_smug_brown_bear",
  "tile_07_goofy_tiger",
  "tile_08_green_gift_mascot",
  "tile_09_lion_dance",
  "tile_10_goofy_yellow_dragon",
] as const;

export type PikachuTileFrameName = (typeof PIKACHU_TILE_FRAME_NAMES)[number];

/** Number of frames shipped by the production asset catalog. */
export const PIKACHU_TILE_KIND_COUNT = PIKACHU_TILE_FRAME_NAMES.length;

/** The game currently uses eight existing kinds; the remaining frames stay available in the catalog. */
export const PIKACHU_ACTIVE_TILE_KINDS = [
  "peanut",
  "cat",
  "dog",
  "bamboo",
  "kite",
  "stork",
  "rice",
  "drum",
] as const satisfies readonly TileKind[];

const FRAME_BY_TILE_KIND: Record<TileKind, PikachuTileFrameName> = {
  peanut: "tile_01_troll",
  cat: "tile_02_worried_panda",
  dog: "tile_03_boxing_fox",
  bamboo: "tile_04_angry_rabbit",
  kite: "tile_05_sleepy_bear_ball",
  stork: "tile_06_smug_brown_bear",
  rice: "tile_07_goofy_tiger",
  drum: "tile_08_green_gift_mascot",
};

/**
 * Maps the existing game kind convention to a production atlas frame.
 * This is deliberately explicit: an invalid kind must not wrap to another character.
 */
export function getTileFrameName(kind: TileKind): PikachuTileFrameName {
  const frameName = (FRAME_BY_TILE_KIND as Partial<Record<string, PikachuTileFrameName>>)[String(kind)];
  if (!frameName) {
    throw new Error(`[Pikachu tile catalog] Unknown tile kind: ${String(kind)}`);
  }
  return frameName;
}

