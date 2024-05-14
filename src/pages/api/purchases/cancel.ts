import { apiHandler } from "@/lib/apiHelper";
import { CancelReason, SubscriptionPurchase } from "@/lib/billing";
import { PurchaseParams } from "@/lib/purchaseParams";
import { cancelSubscription, fetchSubscriptionPurchase } from "@/lib/purchases";
import { TierKey } from "@/lib/tiers";
import { HttpStatusCode } from "axios";
import type { NextApiRequest, NextApiResponse } from "next";
import { clearSubscriptionCookie } from "./logout";

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
        "Subscription is already cancelled. Cancellation is not needed",
        subscription.cancelReason
      );
      res.status(HttpStatusCode.Gone);
      return;
    }

    await cancelSubscription(params);

    clearSubscriptionCookie(req, res);
    res.status(HttpStatusCode.Ok);
  } finally {
    res.end();
  }
};

export default apiHandler({
  POST: handle,
});
