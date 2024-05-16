import { HttpStatusCode } from "axios";
import { NextApiRequest, NextApiResponse } from "next";
import { validateParameter } from "./apiHelper";
import { ResponseData } from "./apiTypes";
import { CancelReason, SubscriptionPurchase } from "./billing";
import { PurchaseParams } from "./purchaseParams";
import { fetchSubscriptionPurchase } from "./purchases";
import { TierKey } from "./tier";

export const getSubscriptionFromRequest = async (
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
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
    console.log(
      "Subscription is cancelled with reason",
      subscription.cancelReason
    );
    res
      .status(HttpStatusCode.Gone)
      .json({ message: "Subscription is already cancelled" });
    return;
  }

  return { subscription, params };
};

export const shouldRevoke = (subscription: SubscriptionPurchase) =>
  subscription.isGracePeriod();
