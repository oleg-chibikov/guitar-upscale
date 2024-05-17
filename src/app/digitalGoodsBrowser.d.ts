// In your local index.d.ts file

// Import the original interface
import "@types/digital-goods-browser";

// Define your TierKey type
export type TierKey = "guitar_upscale.composer" | "guitar_upscale.explorer";

export interface GuitarUpscaleSpecificDigitalGoodsProductDetails
  extends DigitalGoodsProductDetails {
  itemId: TierKey; // Override itemId with TierKey type
}
