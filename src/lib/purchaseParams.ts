import { getCookie, setCookie } from "cookies-next";
import { NextApiRequest, NextApiResponse } from "next/types";

export interface PurchaseParams {
  itemId: string; // sku
  purchaseToken: string;
}

export const setSubscriptionCookie = (
  params: PurchaseParams,
  req: NextApiRequest,
  res: NextApiResponse
) => {
  setCookie("subscriptionData", params.itemId + "|" + params.purchaseToken, {
    req,
    res,
    maxAge: 60 * 60 * 24,
    sameSite: true,
    secure: true,
    httpOnly: true,
  });
};

export const getDataFromSubscriptionCookie = () => {
  const value = getCookie("subscriptionData");
  if (!value) {
    return undefined;
  }
  const parts = value.split("|");
  return { itemId: parts[0], purchaseToken: parts[1] } as PurchaseParams;
};
