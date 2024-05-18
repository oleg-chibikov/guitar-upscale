/* Cancel Flow:
1) If the subscription is in grace period then it can be revoked (it will be refunded straight away). In this case the subscription cookie is deleted straight away
2) Otherwise it will be cancelled but will remain active until its expiration time. It won't be renewed after that. In this case the subscription cookie stays intact and will be removed by the permissions mismatch check
*/

import { apiHandler } from "@/lib/apiHelper";
import {
  CancellationMode,
  SubscriptionActionResponseData,
} from "@/lib/apiTypes";
import { cancelSubscription, revokeSubscription } from "@/lib/purchases";
import {
  SubscriptionData,
  getCancelledSubscriptionFromRequest,
  getSubscriptionFromRequest,
  shouldRevoke,
} from "@/lib/subscriptionHelper";
import { Tier, tierMap } from "@/lib/tier";
import { HttpStatusCode } from "axios";
import type { NextApiRequest, NextApiResponse } from "next";
import { clearSubscriptionCookie } from "./logout";

export const cancel = async (subscriptionData: SubscriptionData) => {
  const { subscription, params } = subscriptionData;

  let mode: CancellationMode = CancellationMode.Cancel;
  if (shouldRevoke(subscription)) {
    console.log(
      "Subscription is still in grace period. Revoking permissions",
      params
    );
    await revokeSubscription(params);
    mode = CancellationMode.Revoke;
  } else {
    console.log(
      "Subscription is not in grace period anymore. Keeping permissions",
      params
    );
    await cancelSubscription(params);
    // we should keep the permissions. it will be revoked only when the subscription expires
  }
  return mode;
};

const getMaxTier = (tiers: (Tier | undefined)[]): Tier | undefined => {
  let hasExplorer = false;
  for (const tier of tiers) {
    if (tier === "Composer") {
      return tier;
    } else if (tier === "Explorer") {
      hasExplorer = true;
    }
  }
  if (hasExplorer) {
    return "Explorer";
  }
  return undefined;
};

const handle = async (
  req: NextApiRequest,
  res: NextApiResponse<SubscriptionActionResponseData>
) => {
  const subscriptionToCancel = await getSubscriptionFromRequest(req, res, {
    allowCancelled: false,
    required: true,
  });
  if (!subscriptionToCancel) {
    return undefined;
  }
  const mode = await cancel(subscriptionToCancel);

  let newTier: Tier | undefined;
  let tierChanged: boolean;

  const anotherCancelledSubscription =
    await getCancelledSubscriptionFromRequest(req, res);
  const subscriptionToCancelTier = tierMap.get(
    subscriptionToCancel.params.itemId
  );
  if (!anotherCancelledSubscription) {
    if (mode === CancellationMode.Revoke) {
      // no permissions after revoke when there is no another cancelled subscription
      clearSubscriptionCookie(req, res);
      tierChanged = true;
      newTier = undefined;
    } else {
      // cancel, but leave permissions from the subscription that was just cancelled
      tierChanged = false;
      newTier = subscriptionToCancelTier;
    }
  } else {
    // leave the highest tier of cancelledSubscriptions
    tierChanged = false;
    newTier = getMaxTier([
      subscriptionToCancelTier,
      tierMap.get(anotherCancelledSubscription.params.itemId),
    ]);
  }

  res.status(HttpStatusCode.Ok).json({
    message: mode === CancellationMode.Revoke ? "Revoked" : "Cancelled",
    tierChanged,
    newTier,
  } as SubscriptionActionResponseData);
};

export default apiHandler({
  POST: handle,
});
