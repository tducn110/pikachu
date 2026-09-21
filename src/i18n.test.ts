import { describe, expect, it } from "vitest";
import i18n, { DEFAULT_LANGUAGE, resolveInitialLanguage, formatNumber } from "./i18n";

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

  it("has English leaderboard empty and anonymous-player copy", async () => {
    await i18n.changeLanguage("en");
    expect(i18n.t("no_scores_yet")).toBe("There are no scores on the leaderboard yet.");
    expect(i18n.t("anonymous_player")).toBe("Player");
  });

  it("formats numbers according to active language locale", async () => {
    await i18n.changeLanguage("en");
    expect(formatNumber(1024)).toBe("1,024");

    await i18n.changeLanguage("vi");
    expect(formatNumber(1024)).toBe("1.024");
  });
});
