export type Tier = "Explorer" | "Composer";
export type TierKey = "guitar_upscale.composer" | "guitar_upscale.explorer";

export const tierMap = new Map<TierKey, Tier>([
  ["guitar_upscale.composer", "Composer"],
  ["guitar_upscale.explorer", "Explorer"],
]);
