import { apiHandler } from "@/lib/apiHelper";
import { CancelReason, SubscriptionPurchase } from "@/lib/billing";
import {
  GOOGLE_PLAY_SUBSCRIPTION_COOKIE_KEY,
  PurchaseParams,
  getCookieValue,
} from "@/lib/purchaseParams";
import {
  acknowledgeSubscriptionPurchase,
  fetchSubscriptionPurchase,
} from "@/lib/purchases";
import { TierKey } from "@/lib/tiers";
import { HttpStatusCode } from "axios";
import { setCookie } from "cookies-next";
import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
  subscription?: SubscriptionPurchase;
  error?: string;
};

function validateParameter<T>(
  param: unknown,
  paramName: string,
  res: NextApiResponse
): T | null {
  if (typeof param !== "string") {
    res.status(400).json({ error: `Parameter ${paramName} must be a string.` });
    return null; // Validation failed
  }
  return param as T; // Validation passed
}

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
    const itemId = validateParameter<TierKey>(req.query.itemId, "itemId", res);

    const purchaseToken = validateParameter<string>(
      req.query.purchaseToken,
      "purchaseToken",
      res
    );

    if (itemId === null || purchaseToken === null) {
      return; // Exit early if validation fails
    }

    const params: PurchaseParams = { itemId, purchaseToken };
    const subscription = await fetchSubscriptionPurchase(params);

    if (subscription?.cancelReason !== CancelReason.NONE) {
      console.log(
        "Subscription is cancelled. Permissions won't be set",
        subscription.cancelReason
      );
      res.status(HttpStatusCode.Gone);
      return;
    }

    const wasAcknowledged = subscription?.wasAcknowledged();
    console.log("Subscription acknowdegement state", wasAcknowledged);
    // TODO: Validate subscription somehow (we might need to store users and subscriptions in the db)

    if (!wasAcknowledged) {
      await acknowledgeSubscriptionPurchase(params);
    }

    setSubscriptionCookie(params, req, res);
    res.status(HttpStatusCode.Ok);
  } finally {
    res.end();
  }
};

export default apiHandler({
  POST: handle,
});
