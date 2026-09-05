export type RewardType = "revive" | "support" | "x2";
export type AdResult = "success" | "cancelled" | "failed";

export async function requestRewardedAd(
  rewardType: RewardType,
  options?: { beforeAd?: () => void; afterAd?: () => void }
): Promise<AdResult> {
  options?.beforeAd?.();
  options?.afterAd?.();
  return "success";
}

/** Show an interstitial at a natural transition (next level, restart).
 *  ponytail: fail-open — transition always continues regardless of ad outcome. */
export async function requestInterstitialAd(options: {
  type: "next" | "start" | "pause" | "browse";
  name: string;
  beforeAd?: () => void;
  afterAd?: () => void;
}): Promise<void> {
  options.beforeAd?.();
  options.afterAd?.();
}
