/* Acknowledge Flow:
1) Acknowledge happens in 2 flows
  a) new purchase
  b) permissions mismatch - when Google play lists the subscription but permissions are not set
2) It checks that subscription is not cancelled (getSubscriptionFromRequest). If cancelled - frontend just ignores it and leaves intact
3) If the subscription is not acknowledged yet (it can happen in the b) flow when there was an error) - it acknowledges it. It doesn't affect the flow itself. Just lets Google Play know it's acknowledged
4) It grants the permissions for the selected tier and sets them in the cookie
*/

import { apiHandler } from "@/lib/apiHelper";
import { ResponseData } from "@/lib/apiTypes";
import {
  GOOGLE_PLAY_SUBSCRIPTION_COOKIE_KEY,
  PurchaseParams,
  getCookieValue,
} from "@/lib/purchaseParams";
import { acknowledgeSubscriptionPurchase } from "@/lib/purchases";
import {
  SubscriptionData,
  getSubscriptionFromRequest,
} from "@/lib/subscriptionHelper";
import { HttpStatusCode } from "axios";
import { setCookie } from "cookies-next";
import type { NextApiRequest, NextApiResponse } from "next";

export const setSubscriptionCookie = (
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

export const acknowledge = async (subscriptionData: SubscriptionData) => {
  const { subscription, params } = subscriptionData;
  const wasAcknowledged = subscription?.wasAcknowledged();
  console.log("Subscription acknowdegement state", wasAcknowledged);
  // TODO: Validate subscription somehow (we might need to store users and subscriptions in the db)

  if (!wasAcknowledged) {
    await acknowledgeSubscriptionPurchase(params);
  }
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
    await acknowledge(subscriptionData);

    setSubscriptionCookie(subscriptionData.params, req, res);
    res.status(HttpStatusCode.Ok).json({ message: "Acknowledged" });
  } finally {
    res.end();
  }
};

export default apiHandler({
  POST: handle,
});
