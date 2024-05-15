import { HttpStatusCode } from "axios";
import { NextApiRequest, NextApiResponse } from "next";
import { validateParameter } from "./apiHelper";
import { CancelReason, SubscriptionPurchase } from "./billing";
import { PurchaseParams } from "./purchaseParams";
import { fetchSubscriptionPurchase } from "./purchases";
import { TierKey } from "./tier";

export type SubscriptionResponseData = {
  subscription?: SubscriptionPurchase;
  error?: string;
};

export const getSubscriptionFromRequest = async <T>(
  req: NextApiRequest,
  res: NextApiResponse<T>,
  allowCancelled: boolean
) => {
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

  if (!allowCancelled && subscription?.cancelReason !== CancelReason.NONE) {
    console.log("Subscription is cancelled", subscription.cancelReason);
    res.status(HttpStatusCode.Gone);
    return;
  }

  return { subscription, params };
};
