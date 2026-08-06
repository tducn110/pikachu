import { Assets, type Spritesheet, type Texture } from "pixi.js";
import {
  getTileFrameName,
  PIKACHU_ACTIVE_TILE_KINDS,
  PIKACHU_TILE_FRAME_NAMES,
  PIKACHU_TILE_FRAME_SIZE,
  type PikachuTileFrameName,
} from "./pikachuTileCatalog";
import type { TileKind } from "../../../utils/pairMatchLogic";

export const PIKACHU_TILE_ATLAS_URL = "/pikachu_tile_characters_final/atlas/tiles_256.json";

export type PikachuTileAssets = {
  texturesByKind: ReadonlyMap<TileKind, Texture>;
  frameNamesByKind: ReadonlyMap<TileKind, PikachuTileFrameName>;
};

let cachedAssetsPromise: Promise<PikachuTileAssets> | null = null;

/** Load and validate the atlas once for the lifetime of the page. */
export function loadPikachuTileAssets(): Promise<PikachuTileAssets> {
  if (!cachedAssetsPromise) {
    cachedAssetsPromise = loadAndValidatePikachuTileAssets();
  }
  return cachedAssetsPromise;
}

async function loadAndValidatePikachuTileAssets(): Promise<PikachuTileAssets> {
  let sheet: Spritesheet;
  try {
    sheet = await Assets.load<Spritesheet>(PIKACHU_TILE_ATLAS_URL);
  } catch (error) {
    const reason = error instanceof Error ? `: ${error.message}` : "";
    throw new Error(`Failed to load Pikachu tile atlas ${PIKACHU_TILE_ATLAS_URL}${reason}`);
  }

  const missingFrames = PIKACHU_TILE_FRAME_NAMES.filter((frameName) => !sheet.textures[frameName]);
  if (missingFrames.length > 0) {
    throw new Error(
      `Pikachu tile atlas ${PIKACHU_TILE_ATLAS_URL} is missing frame(s): ${missingFrames.join(", ")}`,
    );
  }

  const invalidFrames = PIKACHU_TILE_FRAME_NAMES.filter((frameName) => {
    const texture = sheet.textures[frameName];
    return (
      texture.orig.width !== PIKACHU_TILE_FRAME_SIZE ||
      texture.orig.height !== PIKACHU_TILE_FRAME_SIZE ||
      texture.frame.width !== PIKACHU_TILE_FRAME_SIZE ||
      texture.frame.height !== PIKACHU_TILE_FRAME_SIZE
    );
  });
  if (invalidFrames.length > 0) {
    throw new Error(
      `Pikachu tile atlas ${PIKACHU_TILE_ATLAS_URL} has invalid ${PIKACHU_TILE_FRAME_SIZE}x${PIKACHU_TILE_FRAME_SIZE} frame(s): ${invalidFrames.join(", ")}`,
    );
  }

  const texturesByKind = new Map<TileKind, Texture>();
  const frameNamesByKind = new Map<TileKind, PikachuTileFrameName>();
  for (const kind of PIKACHU_ACTIVE_TILE_KINDS) {
    const frameName = getTileFrameName(kind);
    const texture = sheet.textures[frameName];
    if (!texture) {
      throw new Error(`Pikachu tile atlas ${PIKACHU_TILE_ATLAS_URL} has no texture for frame: ${frameName}`);
    }
    texturesByKind.set(kind, texture);
    frameNamesByKind.set(kind, frameName);
  }

  return { texturesByKind, frameNamesByKind };
}

