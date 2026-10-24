"use server";

import { TierKey, tierMap } from "@/lib/tier";
import { HttpStatusCode } from "axios";
import { differenceInDays, intervalToDuration } from "date-fns";
import { NextApiRequest, NextApiResponse } from "next";
import { CancellationMode, ResponseData } from "./apiTypes";
import { CancelReason, SubscriptionPurchase } from "./billing";
import { PurchaseParams } from "./purchaseParams";
import {
  acknowledgeSubscriptionPurchase,
  cancelSubscription,
  deferSubscription,
  fetchSubscriptionPurchase,
  revokeSubscription,
} from "./purchases";

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
  { allowCancelled, paramNames, required }: GetSubscriptionParams,
): Promise<SubscriptionData | undefined> => {
  const paramCollection = (
    req.method === "POST" ? req.body : req.query
  ) as Record<string, string | null | undefined>;
  // Extract parameters from the body instead of query
  const itemId = paramCollection[paramNames?.itemId ?? "itemId"] as
    TierKey | null | undefined;
  const purchaseToken =
    paramCollection[paramNames?.purchaseToken ?? "purchaseToken"];

  if (
    itemId === null ||
    itemId === undefined ||
    !itemId.length ||
    purchaseToken === null ||
    purchaseToken === undefined ||
    !purchaseToken.length
  ) {
    if (required) {
      res
        .status(HttpStatusCode.BadRequest)
        .json({ error: "Required parameters are not set" } as T);
    }
    return; // Exit early if validation fails
  }

  if (!tierMap.has(itemId)) {
    res
      .status(HttpStatusCode.BadRequest)
      .json({ error: "Unknown subscription item" } as T);
    return;
  }

  const params: PurchaseParams = { itemId, purchaseToken };
  const subscription = await fetchSubscriptionPurchase(params);

  // The client sends itemId, so it must match what Google says the token bought.
  if (subscription.productId !== itemId) {
    res
      .status(HttpStatusCode.BadRequest)
      .json({ error: "Purchase does not match the subscription item" } as T);
    return;
  }

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
  T extends ResponseData,
>(
  req: NextApiRequest,
  res: NextApiResponse<T>,
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

export async function defer(
  cancelledSubscription: SubscriptionData,
  purchasedSubscription: SubscriptionData,
) {
  const newSubscriptionDesiredStartTimeMs =
    cancelledSubscription.subscription.expiryTimeMillis;

  const newSubscriptionCurrentExpiryTimeMs =
    purchasedSubscription.subscription.expiryTimeMillis;

  const currentSubscriptionDurationMs =
    purchasedSubscription.subscription.expiryTimeMillis -
    purchasedSubscription.subscription.startTimeMillis;

  const newSubscriptionDesiredExpiryTimeMs =
    newSubscriptionDesiredStartTimeMs + currentSubscriptionDurationMs;

  const expiryDaysDifference = differenceInDays(
    newSubscriptionDesiredExpiryTimeMs,
    newSubscriptionCurrentExpiryTimeMs,
  );
  console.log(
    `Deferring subscription %s;
        desired start time: %o;
        desired expiry time: %o;
        current expiry time: %o,
        duration: %o;
        expiry time difference in days: %o`,
    purchasedSubscription.params.itemId,
    new Date(newSubscriptionDesiredStartTimeMs),
    new Date(newSubscriptionDesiredExpiryTimeMs),
    new Date(newSubscriptionCurrentExpiryTimeMs),
    intervalToDuration({
      start: purchasedSubscription.subscription.startTimeMillis,
      end: purchasedSubscription.subscription.expiryTimeMillis,
    }),
    expiryDaysDifference,
  );
  if (expiryDaysDifference >= 1 && expiryDaysDifference <= 365) {
    try {
      await deferSubscription(
        purchasedSubscription.params,
        purchasedSubscription.subscription.expiryTimeMillis,
        newSubscriptionDesiredExpiryTimeMs,
      );
      return true;
    } catch {
      return false;
    }
  } else {
    // https://developer.android.com/google/play/billing/subscriptions#defer
    console.log(
      "Difference in expiry time should be between 1 day and 1 year. Subscription won't be deferred",
    );
    return false;
  }
}

export const cancel = async (subscriptionData: SubscriptionData) => {
  const { subscription, params } = subscriptionData;

  let mode: CancellationMode = CancellationMode.Cancel;
  if (shouldRevoke(subscription)) {
    console.log(
      "Subscription %s is still in grace period. Revoking permissions",
      params.itemId,
    );
    await revokeSubscription(params);
    mode = CancellationMode.Revoke;
  } else {
    console.log(
      "Subscription %s is not in grace period anymore. Keeping permissions",
      params.itemId,
    );
    await cancelSubscription(params);
    // we should keep the permissions. it will be revoked only when the subscription expires
  }
  return mode;
};

export const acknowledge = async (subscriptionData: SubscriptionData) => {
  const { subscription, params } = subscriptionData;
  const wasAcknowledged = subscription?.wasAcknowledged();
  console.log(
    "Subscription %s acknowledgement state %s",
    params.itemId,
    wasAcknowledged,
  );
  // TODO: Validate subscription somehow (we might need to store users and subscriptions in the db)

  if (!wasAcknowledged) {
    await acknowledgeSubscriptionPurchase(params);
  }
};
