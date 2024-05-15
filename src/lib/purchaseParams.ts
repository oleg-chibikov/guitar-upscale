import { TierKey } from "./tier";

export const GOOGLE_PLAY_SUBSCRIPTION_COOKIE_KEY = "subscriptionData";

export const getCookieValue = (params: PurchaseParams) =>
  params.itemId + "|" + params.purchaseToken;

export const getDataFromCookieValue = (cookieValue: string) => {
  const parts = cookieValue.split("|");
  return { itemId: parts[0], purchaseToken: parts[1] } as PurchaseParams;
};

export interface PurchaseParams {
  itemId: TierKey; // sku
  purchaseToken: string;
}
