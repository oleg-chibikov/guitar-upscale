/* Acknowledge Flow:
1) Acknowledge happens in 2 flows
  a) new purchase
  b) permissions mismatch - when Google play lists the subscription but permissions are not set
2) It checks that subscription is not cancelled (getSubscriptionFromRequest). If cancelled - frontend just ignores it and leaves intact
3) If the subscription is not acknowledged yet (it can happen in the b) flow when there was an error) - it acknowledges it. It doesn't affect the flow itself. Just lets Google Play know it's acknowledged
4) It grants the permissions for the selected tier and sets them in the cookie
*/

import { apiHandler } from "@/lib/apiHelper";
import { SubscriptionActionResponseData } from "@/lib/apiTypes";
import {
  GOOGLE_PLAY_SUBSCRIPTION_COOKIE_KEY,
  PurchaseParams,
  getCookieValue,
} from "@/lib/purchaseParams";
import { acknowledgeSubscriptionPurchase } from "@/lib/purchases";
import {
  SubscriptionData,
  getCancelledSubscriptionFromRequest,
  getSubscriptionFromRequest,
} from "@/lib/subscriptionHelper";
import { Tier, tierMap } from "@/lib/tier";
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
  res: NextApiResponse<SubscriptionActionResponseData>
) => {
  // we should grant permissions even if the subscription is cancelled - it is valid until its expiration period
  const subscriptionData = await getSubscriptionFromRequest(req, res, {
    allowCancelled: true, // allow re-subscribe
    required: true,
  });
  if (!subscriptionData) {
    return;
  }

  await acknowledge(subscriptionData);

  const cancelledSubscription = await getCancelledSubscriptionFromRequest(
    req,
    res
  );

  let newTier: Tier;
  let tierChanged: boolean;

  const purchasedTier = tierMap.get(subscriptionData.params.itemId)!;

  if (!cancelledSubscription) {
    // set new tier from purchased subscription
    tierChanged = true;
    setSubscriptionCookie(subscriptionData.params, req, res);
    newTier = purchasedTier;
  } else {
    const cancelledTier = tierMap.get(cancelledSubscription.params.itemId);
    if (cancelledTier === "Composer") {
      // user already has composer tier - leave it
      tierChanged = false;
      newTier = cancelledTier;
    } else {
      // cancelled tier is explorer
      if (purchasedTier === "Composer") {
        // if the existing subscription is Explorer but new is Composer - set permissions
        tierChanged = true;
        newTier = purchasedTier;
        setSubscriptionCookie(subscriptionData.params, req, res);
      } else {
        // it shouldn't happen - it means the cancelled and purchased tiers are the same
        tierChanged = false;
        newTier = "Explorer";
      }
    }
  }

  res.status(HttpStatusCode.Ok).json({
    message: "Acknowledged",
    newTier,
    tierChanged,
  } as SubscriptionActionResponseData);
};

export default apiHandler({
  POST: handle,
});
