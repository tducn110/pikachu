import { describe, expect, it } from "vitest";
import { PIKACHU_CHARACTERS } from "../components/game/pixi/pikachuCharacterCatalog";
import { resolveCharacterIds } from "./useGameBoard";

describe("resolveCharacterIds", () => {
  it("uses the runtime catalog for initial/reset/next-level calls without supplied IDs", () => {
    const expected = PIKACHU_CHARACTERS.map((character) => character.id);
    expect(resolveCharacterIds(undefined, [])).toEqual(expected);
    expect(resolveCharacterIds([], [])).toEqual(expected);
  });

  it("does not let an empty optional catalog override a configured catalog", () => {
    expect(resolveCharacterIds([], ["A", "B"])).toEqual(["A", "B"]);
  });

  it("uses explicit non-empty IDs for a reset or level change", () => {
    expect(resolveCharacterIds(["C", "D"], ["A", "B"])).toEqual(["C", "D"]);
  });
});
