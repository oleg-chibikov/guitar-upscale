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

type GetSubscriptionParams = {
  allowCancelled: boolean;
  paramNames?: {
    itemId: string;
    purchaseToken: string;
  };
  required: boolean;
};

export const getSubscriptionFromRequest = async <T extends ResponseData>(
  req: NextApiRequest,
  res: NextApiResponse<T>,
  { allowCancelled, paramNames, required }: GetSubscriptionParams
): Promise<SubscriptionData | undefined> => {
  const paramCollection = req.method === "POST" ? req.body : req.query;
  // Extract parameters from the body instead of query
  const itemId = paramCollection[paramNames?.itemId ?? "itemId"];
  const purchaseToken =
    paramCollection[paramNames?.purchaseToken ?? "purchaseToken"];

  if (itemId === null || purchaseToken === null) {
    if (required) {
      res
        .status(HttpStatusCode.BadRequest)
        .json({ error: "Required parameters are not set" } as T);
    }
    return; // Exit early if validation fails
  }

  const params: PurchaseParams = { itemId, purchaseToken };
  const subscription = await fetchSubscriptionPurchase(params);

  if (!allowCancelled && subscription?.cancelReason !== CancelReason.NONE) {
    const message = "Subscription is already cancelled";
    console.log(message);
    res.status(HttpStatusCode.Gone).json({ error: message } as T);
    return;
  }

  return { subscription, params };
};

// This is a single cancelled subscription with the highest tier
export const getCancelledSubscriptionFromRequest = async <
  T extends ResponseData
>(
  req: NextApiRequest,
  res: NextApiResponse<T>
) => {
  return await getSubscriptionFromRequest(req, res, {
    allowCancelled: true, // this param can contain only cancelled subscription
    required: false, // there might be no such subscription,
    paramNames: {
      itemId: "cancelledSubscriptionItemId",
      purchaseToken: "cancelledSubscriptionPurchaseToken",
    },
  });
};

export const shouldRevoke = (subscription: SubscriptionPurchase) =>
  subscription.isGracePeriod();
