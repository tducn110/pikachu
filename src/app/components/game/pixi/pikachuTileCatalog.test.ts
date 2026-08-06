import { describe, expect, it } from "vitest";
import atlas from "../../../../../public/pikachu_tile_characters_final/atlas/tiles_256.json";
import {
  getTileFrameName,
  PIKACHU_ACTIVE_TILE_KINDS,
  PIKACHU_TILE_FRAME_NAMES,
  PIKACHU_TILE_KIND_COUNT,
} from "./pikachuTileCatalog";
import type { TileKind } from "../../../utils/pairMatchLogic";

describe("pikachu tile catalog", () => {
  it("contains ten unique production frame names", () => {
    expect(PIKACHU_TILE_KIND_COUNT).toBe(10);
    expect(PIKACHU_TILE_FRAME_NAMES).toHaveLength(10);
    expect(new Set(PIKACHU_TILE_FRAME_NAMES).size).toBe(10);
  });

  it("maps every existing game kind to an explicit frame", () => {
    for (const kind of PIKACHU_ACTIVE_TILE_KINDS) {
      expect(getTileFrameName(kind)).toBeTruthy();
    }
    expect(getTileFrameName("cat")).toBe(getTileFrameName("cat"));
  });

  it("does not silently wrap an invalid kind", () => {
    expect(() => getTileFrameName("unknown" as TileKind)).toThrow(/Unknown tile kind/);
  });

  it("matches every catalog frame to the checked-in atlas JSON", () => {
    expect(Object.keys(atlas.frames)).toEqual([...PIKACHU_TILE_FRAME_NAMES]);
    for (const frameName of PIKACHU_TILE_FRAME_NAMES) {
      expect(atlas.frames[frameName]?.frame.w).toBe(256);
      expect(atlas.frames[frameName]?.frame.h).toBe(256);
    }
  });
});
