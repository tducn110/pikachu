export type RewardType = "revive" | "support" | "x2";
export type AdResult = "success" | "cancelled" | "failed";

/**
 * Mocks an ad request. Later this can be replaced by Wink API or any real ad network.
 * @param rewardType the reason for requesting the rewarded ad.
 * @returns a promise resolving to "success", "cancelled", or "failed".
 */
export async function requestRewardedAd(rewardType: RewardType): Promise<AdResult> {
  return new Promise((resolve) => {
    // Simulate network delay / ad playing
    setTimeout(() => {
      resolve("success");
    }, 1000);
  });
}
