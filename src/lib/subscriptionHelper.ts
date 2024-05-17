import { HttpStatusCode } from "axios";
import { NextApiRequest, NextApiResponse } from "next";
import { ResponseData } from "./apiTypes";
import { CancelReason, SubscriptionPurchase } from "./billing";
import { PurchaseParams } from "./purchaseParams";
import { fetchSubscriptionPurchase } from "./purchases";

export type SubscriptionData = {
  subscription: SubscriptionPurchase;
  params: PurchaseParams;
};

export const getSubscriptionFromRequest = async (
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
  allowCancelled: boolean,
  paramNames?: {
    itemId: string;
    purchaseToken: string;
  }
): Promise<SubscriptionData | undefined> => {
  // Extract parameters from the body instead of query
  const itemId = req.body[paramNames?.itemId ?? "itemId"];
  const purchaseToken = req.body[paramNames?.purchaseToken ?? "purchaseToken"];

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
