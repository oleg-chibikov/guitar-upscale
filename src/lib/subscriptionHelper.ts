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
  // TODO: Does not work
  console.log("Request", {
    body: req.body,
    query: req.query,
    method: req.method,
  });
  const paramCollection = req.method === "POST" ? req.body : req.query;
  // Extract parameters from the body instead of query
  const itemId = paramCollection[paramNames?.itemId ?? "itemId"];
  const purchaseToken =
    paramCollection[paramNames?.purchaseToken ?? "purchaseToken"];

  if (itemId === null || purchaseToken === null) {
    res
      .status(HttpStatusCode.BadRequest)
      .json({ message: "Required parameters are not set" });
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
