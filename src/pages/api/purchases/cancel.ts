/* Cancel Flow:
1) If the subscription is in grace period then it can be revoked (it will be refunded straight away). In this case the subscription cookie is deleted straight away
2) Otherwise it will be cancelled but will remain active until its expiration time. It won't be renewed after that. In this case the subscription cookie stays intact and will be removed by the permissions mismatch check
*/

import { apiHandler } from "@/lib/apiHelper";
import {
  CancellationMode,
  SubscriptionActionResponseData,
} from "@/lib/apiTypes";
import { clearSubscriptionCookie } from "@/lib/subscriptionCookieUtils";
import {
  cancel,
  getCancelledSubscriptionFromRequest,
  getSubscriptionFromRequest,
} from "@/lib/subscriptionHelper";
import { Tier, tierMap } from "@/lib/tier";
import { HttpStatusCode } from "axios";
import type { NextApiRequest, NextApiResponse } from "next";

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
  res: NextApiResponse<SubscriptionActionResponseData>,
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
    subscriptionToCancel.params.itemId,
  );
  if (!anotherCancelledSubscription) {
    if (mode === CancellationMode.Revoke) {
      // no permissions after revoke when there is no another cancelled subscription
      await clearSubscriptionCookie(req, res);
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
