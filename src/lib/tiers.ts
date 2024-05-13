export type Tier = "Explorer" | "Composer";

export const tierMap = new Map<string, Tier>([
  ["guitar_upscale.composer", "Composer"],
  ["guitar_upscale.explorer", "Explorer"],
]);
