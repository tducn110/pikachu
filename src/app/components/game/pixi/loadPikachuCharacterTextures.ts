/**
 * loadPikachuCharacterTextures.ts
 *
 * Loads BOTH atlases once per page session using PixiJS Assets.
 * Returns a ReadonlyMap<characterId, Texture> covering all 20 characters.
 *
 * Never call Assets.load() outside this module.
 * Cache is module-scoped – survives level changes, shuffles, resets.
 */
import { Assets, type Spritesheet, type Texture } from "pixi.js";
import {
  LEGACY_ATLAS_URL,
  NEW_ATLAS_URL,
  PIKACHU_CHARACTERS,
  CHARACTER_BY_ID,
} from "./pikachuCharacterCatalog";

export type CharacterTextures = ReadonlyMap<string, Texture>;

let cachedPromise: Promise<CharacterTextures> | null = null;

/** Call this once. Returns the same Promise on subsequent calls. */
export function loadPikachuCharacterTextures(): Promise<CharacterTextures> {
  if (!cachedPromise) {
    cachedPromise = doLoad();
  }
  return cachedPromise;
}

async function doLoad(): Promise<CharacterTextures> {
  let legacySheet: Spritesheet;
  let newSheet: Spritesheet;

  try {
    [legacySheet, newSheet] = await Promise.all([
      Assets.load<Spritesheet>(LEGACY_ATLAS_URL),
      Assets.load<Spritesheet>(NEW_ATLAS_URL),
    ]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to load Pikachu character atlases: ${msg}`);
  }

  const map = new Map<string, Texture>();

  for (const char of PIKACHU_CHARACTERS) {
    const sheet = char.pack === "legacy" ? legacySheet : newSheet;
    const texture = sheet.textures[char.frame];
    if (!texture) {
      throw new Error(
        `Pikachu ${char.pack} atlas is missing frame "${char.frame}" for character "${char.id}"`,
      );
    }
    map.set(char.id, texture);
  }

  return map as CharacterTextures;
}

/** Throws if textures haven't been loaded yet (dev safety guard). */
export function getPikachuCharacterTexture(
  textures: CharacterTextures,
  characterId: string,
): Texture {
  const t = textures.get(characterId);
  if (!t) {
    const char = CHARACTER_BY_ID.get(characterId);
    const hint = char
      ? `(frame: ${char.frame}, pack: ${char.pack})`
      : "(unknown character ID)";
    throw new Error(`No texture loaded for character "${characterId}" ${hint}`);
  }
  return t;
}
