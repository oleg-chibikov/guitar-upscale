import { deleteCookie, setCookie } from "cookies-next/server";
import { NextApiRequest, NextApiResponse } from "next/types";
import { ResponseData } from "./apiTypes";
import {
  GOOGLE_PLAY_SUBSCRIPTION_COOKIE_KEY,
  PurchaseParams,
  getCookieValue,
} from "./purchaseParams";

export const clearSubscriptionCookie = async <T extends ResponseData>(
  req: NextApiRequest,
  res: NextApiResponse<T>
) => {
  await deleteCookie(GOOGLE_PLAY_SUBSCRIPTION_COOKIE_KEY, {
    req,
    res,
  });
  console.log("Subscription cookie cleared");
};

export const setSubscriptionCookie = async (
  params: PurchaseParams,
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const value = getCookieValue(params);
  await setCookie(GOOGLE_PLAY_SUBSCRIPTION_COOKIE_KEY, value, {
    req,
    res,
    maxAge: 60 * 60 * 24,
    sameSite: true,
    secure: true,
    httpOnly: true,
  });
  console.log("Subscription cookie set", value);
};
