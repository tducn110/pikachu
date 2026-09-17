import { describe, expect, it } from "vitest";
import {
  computeSupportLockState,
  getSelectedIdsAfterTileTap,
  type SupportType,
} from "./usePairMatchGame";

describe("computeSupportLockState - Power-up Ad Limit (1 ad max, then locked)", () => {
  it("starts with all power-ups unlocked when stock > 0 and ad not used", () => {
    const stock: Record<SupportType, number> = { hint: 1, shuffle: 1, bomb: 1 };
    const adUsed: Record<SupportType, boolean> = { hint: false, shuffle: false, bomb: false };

    const lockState = computeSupportLockState(stock, adUsed);

    expect(lockState.hint).toBe(false);
    expect(lockState.shuffle).toBe(false);
    expect(lockState.bomb).toBe(false);
  });

  it("remains unlocked when stock reaches 0 if ad has not yet been watched", () => {
    const stock: Record<SupportType, number> = { hint: 0, shuffle: 1, bomb: 0 };
    const adUsed: Record<SupportType, boolean> = { hint: false, shuffle: false, bomb: false };

    const lockState = computeSupportLockState(stock, adUsed);

    // Player can still watch an ad to get +1
    expect(lockState.hint).toBe(false);
    expect(lockState.shuffle).toBe(false);
    expect(lockState.bomb).toBe(false);
  });

  it("remains unlocked after claiming ad while stock > 0", () => {
    const stock: Record<SupportType, number> = { hint: 1, shuffle: 1, bomb: 1 };
    const adUsed: Record<SupportType, boolean> = { hint: true, shuffle: false, bomb: false };

    const lockState = computeSupportLockState(stock, adUsed);

    // Still has the newly replenished stock available
    expect(lockState.hint).toBe(false);
    expect(lockState.shuffle).toBe(false);
    expect(lockState.bomb).toBe(false);
  });

  it("locks the power-up when stock reaches 0 a 2nd time after ad has been used", () => {
    const stock: Record<SupportType, number> = { hint: 0, shuffle: 0, bomb: 0 };
    const adUsed: Record<SupportType, boolean> = { hint: true, shuffle: true, bomb: true };

    const lockState = computeSupportLockState(stock, adUsed);

    // 2nd time depletion locks all 3 power-ups
    expect(lockState.hint).toBe(true);
    expect(lockState.shuffle).toBe(true);
    expect(lockState.bomb).toBe(true);
  });

  it("locks only the power-up whose ad has been used, keeping others eligible", () => {
    const stock: Record<SupportType, number> = { hint: 0, shuffle: 0, bomb: 1 };
    const adUsed: Record<SupportType, boolean> = { hint: true, shuffle: false, bomb: false };

    const lockState = computeSupportLockState(stock, adUsed);

    expect(lockState.hint).toBe(true); // Locked because stock = 0 and ad already used
    expect(lockState.shuffle).toBe(false); // Not locked because ad can still be watched
    expect(lockState.bomb).toBe(false); // Has stock
  });
});

describe("getSelectedIdsAfterTileTap", () => {
  it("clears the selection when the player taps the selected tile again", () => {
    expect(getSelectedIdsAfterTileTap(["tile-a"], "tile-a")).toEqual([]);
  });

  it("adds a different tile so the normal pair-evaluation flow can continue", () => {
    expect(getSelectedIdsAfterTileTap(["tile-a"], "tile-b")).toEqual(["tile-a", "tile-b"]);
  });
});
