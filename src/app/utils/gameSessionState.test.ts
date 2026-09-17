import { describe, expect, it } from "vitest";
import { isPlayableSession } from "./gameSessionState";

describe("isPlayableSession", () => {
  it("allows pause only while a round is actively playing", () => {
    expect(isPlayableSession("playing")).toBe(true);
  });

  it.each(["won", "lost", "revive"] as const)("blocks pause for the terminal state %s", (status) => {
    expect(isPlayableSession(status)).toBe(false);
  });
});
