import { getCookie, setCookie } from "cookies-next";
import { NextApiRequest, NextApiResponse } from "next/types";
import { TierKey } from "./tiers";

export interface PurchaseParams {
  itemId: TierKey; // sku
  purchaseToken: string;
}

export const setSubscriptionCookie = (
  params: PurchaseParams,
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const value = params.itemId + "|" + params.purchaseToken;
  setCookie("subscriptionData", value, {
    req,
    res,
    maxAge: 60 * 60 * 24,
    sameSite: true,
    secure: true,
    httpOnly: true,
  });
  console.log("Subscription cookie set", value);
};

export const getDataFromSubscriptionCookie = () => {
  const value = getCookie("subscriptionData");
  if (!value) {
    console.log("No value in subscription cookie");
    return undefined;
  }
  console.log("Value in subscription cookie", value);
  const parts = value.split("|");
  return { itemId: parts[0], purchaseToken: parts[1] } as PurchaseParams;
};
