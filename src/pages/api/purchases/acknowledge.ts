import { ResponseData, apiHandler } from "@/lib/apiHelper";
import {
  GOOGLE_PLAY_SUBSCRIPTION_COOKIE_KEY,
  PurchaseParams,
  getCookieValue,
} from "@/lib/purchaseParams";
import { acknowledgeSubscriptionPurchase } from "@/lib/purchases";
import { getSubscriptionFromRequest } from "@/lib/subscriptionHelper";
import { HttpStatusCode } from "axios";
import { setCookie } from "cookies-next";
import type { NextApiRequest, NextApiResponse } from "next";

const setSubscriptionCookie = (
  params: PurchaseParams,
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const value = getCookieValue(params);
  setCookie(GOOGLE_PLAY_SUBSCRIPTION_COOKIE_KEY, value, {
    req,
    res,
    maxAge: 60 * 60 * 24,
    sameSite: true,
    secure: true,
    httpOnly: true,
  });
  console.log("Subscription cookie set", value);
};

const handle = async (
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) => {
  try {
    // we should grant permissions even if the subscription is cancelled - it is valid until its expiration period
    const subscriptionData = await getSubscriptionFromRequest(req, res, true);
    if (!subscriptionData) {
      return;
    }
    const { subscription, params } = subscriptionData;

    const wasAcknowledged = subscription?.wasAcknowledged();
    console.log("Subscription acknowdegement state", wasAcknowledged);
    // TODO: Validate subscription somehow (we might need to store users and subscriptions in the db)

    if (!wasAcknowledged) {
      await acknowledgeSubscriptionPurchase(params);
    }

    setSubscriptionCookie(params, req, res);
    res.status(HttpStatusCode.Ok).json({ message: "Acknowledged" });
  } finally {
    res.end();
  }
};

export default apiHandler({
  POST: handle,
});
