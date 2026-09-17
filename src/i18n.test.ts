import { describe, expect, it } from "vitest";
import { DEFAULT_LANGUAGE, resolveInitialLanguage } from "./i18n";

describe("language initialization", () => {
  it("uses English by default", () => {
    expect(DEFAULT_LANGUAGE).toBe("en");
    expect(resolveInitialLanguage(null)).toBe("en");
    expect(resolveInitialLanguage("fr")).toBe("en");
  });

  it("restores a supported player language choice", () => {
    expect(resolveInitialLanguage("vi")).toBe("vi");
    expect(resolveInitialLanguage("en")).toBe("en");
  });
});
