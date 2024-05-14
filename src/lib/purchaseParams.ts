import { TierKey } from "./tiers";

export interface PurchaseParams {
  itemId: TierKey; // sku
  purchaseToken: string;
}
