import { setCookie } from "cookies-next";
import { cookies } from "next/headers";
import { NextApiRequest, NextApiResponse } from "next/types";
import { TierKey } from "./tiers";

const COOKIE_KEY = "subscriptionData";

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
  setCookie(COOKIE_KEY, value, {
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
  const value = cookies().get(COOKIE_KEY)?.value;
  if (!value) {
    console.log("No value in subscription cookie");
    return undefined;
  }
  console.log("Value in subscription cookie", value);
  const parts = value.split("|");
  return { itemId: parts[0], purchaseToken: parts[1] } as PurchaseParams;
};
