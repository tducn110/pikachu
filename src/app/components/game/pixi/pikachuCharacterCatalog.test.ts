import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import {
  CHARACTER_BY_ID,
  PIKACHU_CHARACTERS,
  TOTAL_UNIQUE_CHARACTERS,
  type CharacterDefinition,
} from "./pikachuCharacterCatalog";

type AtlasFrame = { frame: { x: number; y: number; w: number; h: number } };
type Atlas = { frames: Record<string, AtlasFrame> };
type DecodedPng = { width: number; height: number; pixels: Buffer };

const PUBLIC_ROOT = resolve(process.cwd(), "public");

function assetRoot(character: CharacterDefinition): string {
  return character.pack === "legacy"
    ? "pikachu_tile_characters_final"
    : "pikachu_tile_characters_035_044_half_portrait_final";
}

function filename(character: CharacterDefinition): string {
  return character.frame.endsWith(".png") ? character.frame : `${character.frame}.png`;
}

function runtimePath(character: CharacterDefinition): string {
  const directory = character.pack === "legacy" ? "png_256" : "runtime_256";
  return resolve(PUBLIC_ROOT, assetRoot(character), directory, filename(character));
}

function sourcePath(character: CharacterDefinition): string {
  return resolve(PUBLIC_ROOT, assetRoot(character), "png_512", filename(character));
}

function atlasPath(character: CharacterDefinition): string {
  const directory = character.pack === "legacy" ? "atlas" : "atlas_256";
  return resolve(PUBLIC_ROOT, assetRoot(character), directory);
}

function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

function duplicateKeys(hashes: Iterable<[string, string]>): string[][] {
  const keysByHash = new Map<string, string[]>();
  for (const [key, hash] of hashes) {
    keysByHash.set(hash, [...(keysByHash.get(hash) ?? []), key]);
  }
  return [...keysByHash.values()].filter((keys) => keys.length > 1);
}

/** Minimal RGBA/8-bit/non-interlaced PNG decoder; avoids a production dependency. */
function decodePng(path: string): DecodedPng {
  const input = readFileSync(path);
  if (input.subarray(1, 4).toString("ascii") !== "PNG") throw new Error(`${path} is not a PNG`);

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  const compressed: Buffer[] = [];
  while (offset < input.length) {
    const length = input.readUInt32BE(offset);
    const type = input.subarray(offset + 4, offset + 8).toString("ascii");
    const chunk = input.subarray(offset + 8, offset + 8 + length);
    offset += length + 12;
    if (type === "IHDR") {
      width = chunk.readUInt32BE(0);
      height = chunk.readUInt32BE(4);
      bitDepth = chunk[8];
      colorType = chunk[9];
      interlace = chunk[12];
    } else if (type === "IDAT") {
      compressed.push(chunk);
    }
  }
  if (bitDepth !== 8 || colorType !== 6 || interlace !== 0) {
    throw new Error(`${path} must be an 8-bit, RGBA, non-interlaced PNG`);
  }

  const raw = inflateSync(Buffer.concat(compressed));
  const stride = width * 4;
  const pixels = Buffer.alloc(stride * height);
  let sourceOffset = 0;
  for (let rowIndex = 0; rowIndex < height; rowIndex += 1) {
    const filter = raw[sourceOffset++];
    const row = pixels.subarray(rowIndex * stride, (rowIndex + 1) * stride);
    const previous = rowIndex === 0 ? null : pixels.subarray((rowIndex - 1) * stride, rowIndex * stride);
    for (let index = 0; index < stride; index += 1) {
      const value = raw[sourceOffset++];
      const left = index >= 4 ? row[index - 4] : 0;
      const up = previous ? previous[index] : 0;
      const upLeft = previous && index >= 4 ? previous[index - 4] : 0;
      if (filter === 0) row[index] = value;
      else if (filter === 1) row[index] = (value + left) & 0xff;
      else if (filter === 2) row[index] = (value + up) & 0xff;
      else if (filter === 3) row[index] = (value + Math.floor((left + up) / 2)) & 0xff;
      else if (filter === 4) {
        const prediction = left + up - upLeft;
        const leftDistance = Math.abs(prediction - left);
        const upDistance = Math.abs(prediction - up);
        const upLeftDistance = Math.abs(prediction - upLeft);
        const base = leftDistance <= upDistance && leftDistance <= upLeftDistance
          ? left
          : upDistance <= upLeftDistance ? up : upLeft;
        row[index] = (value + base) & 0xff;
      } else throw new Error(`${path} has unsupported PNG filter ${filter}`);
    }
  }
  return { width, height, pixels };
}

function framePixels(image: DecodedPng, frame: AtlasFrame["frame"]): Buffer {
  if (frame.x < 0 || frame.y < 0 || frame.x + frame.w > image.width || frame.y + frame.h > image.height) {
    throw new Error(`Frame ${JSON.stringify(frame)} falls outside atlas ${image.width}×${image.height}`);
  }
  const output = Buffer.alloc(frame.w * frame.h * 4);
  for (let row = 0; row < frame.h; row += 1) {
    const sourceStart = ((frame.y + row) * image.width + frame.x) * 4;
    image.pixels.copy(output, row * frame.w * 4, sourceStart, sourceStart + frame.w * 4);
  }
  return output;
}

describe("active Pikachu character catalog integrity", () => {
  it("has one active logical identity per verified visible character", () => {
    expect(TOTAL_UNIQUE_CHARACTERS).toBe(19);
    expect(CHARACTER_BY_ID.size).toBe(TOTAL_UNIQUE_CHARACTERS);
    expect(new Set(PIKACHU_CHARACTERS.map((character) => character.id)).size).toBe(TOTAL_UNIQUE_CHARACTERS);
    expect(new Set(PIKACHU_CHARACTERS.map((character) => `${character.pack}:${character.frame}`)).size)
      .toBe(TOTAL_UNIQUE_CHARACTERS);
  });

  it("resolves every active character to a valid 256px atlas frame", () => {
    for (const character of PIKACHU_CHARACTERS) {
      const atlas = JSON.parse(readFileSync(resolve(atlasPath(character), "tiles_256.json"), "utf8")) as Atlas;
      const frame = atlas.frames[character.frame]?.frame;
      expect(frame, `${character.id} frame`).toBeTruthy();
      expect(frame?.w).toBe(256);
      expect(frame?.h).toBe(256);
    }
  });

  it("detects exact duplicate master and runtime PNG binaries", () => {
    const masterHashes = PIKACHU_CHARACTERS.map((character) => [character.id, sha256(readFileSync(sourcePath(character)))] as [string, string]);
    const runtimeHashes = PIKACHU_CHARACTERS.map((character) => [character.id, sha256(readFileSync(runtimePath(character)))] as [string, string]);
    expect(duplicateKeys(masterHashes)).toEqual([]);
    expect(duplicateKeys(runtimeHashes)).toEqual([]);
  });

  it("detects duplicate decoded atlas frame pixels, even with different filenames", () => {
    const atlasImages = new Map<string, DecodedPng>();
    const frameHashes: [string, string][] = [];
    for (const character of PIKACHU_CHARACTERS) {
      const key = atlasPath(character);
      let image = atlasImages.get(key);
      if (!image) {
        image = decodePng(resolve(key, "tiles_256.png"));
        atlasImages.set(key, image);
      }
      const atlas = JSON.parse(readFileSync(resolve(key, "tiles_256.json"), "utf8")) as Atlas;
      frameHashes.push([character.id, sha256(framePixels(image, atlas.frames[character.frame].frame))]);
    }
    expect(duplicateKeys(frameHashes)).toEqual([]);
  });
});
