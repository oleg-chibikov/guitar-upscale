/* Upgrade/downgrade Flow:
1) We are passing all the purchased subscriptions with their tokens and itemIds
2) We try the revoke the other subscriptions. If revoked (and refunded) - we just apply the new one
3) If the revoke cannot be applied (grace period is over) then we have 2 paths:
    a) downgrade - still use the Composer while active, defer Explorer to avoid overlap
    b) upgrade - new permissions should fire straight away, the old subscription will just last till its end
*/

import { apiHandler } from "@/lib/apiHelper";
import {
  CancellationMode,
  GetPurchaseResponseData,
  PurchaseAction,
} from "@/lib/apiTypes";
import { setSubscriptionCookie } from "@/lib/subscriptionCookieUtils";
import {
  acknowledge,
  cancel,
  defer,
  getSubscriptionFromRequest,
} from "@/lib/subscriptionHelper";
import { Tier } from "@/lib/tier";
import { HttpStatusCode } from "axios";
import type { NextApiRequest, NextApiResponse } from "next";

const handle = async (
  req: NextApiRequest,
  res: NextApiResponse<GetPurchaseResponseData>
) => {
  const subscriptionData = await getSubscriptionFromRequest(req, res, {
    allowCancelled: false,
    required: true,
  });
  if (!subscriptionData) {
    return;
  }

  // if the old subscription is already cancelled - don't proceed with the operation. Client should use acknowledge endpoint in this case
  const subscriptionToCancel = await getSubscriptionFromRequest(req, res, {
    allowCancelled: false,
    required: true,
    paramNames: { itemId: "oldItemId", purchaseToken: "oldPurchaseToken" },
  });

  if (!subscriptionToCancel) {
    console.error("Subscription to cancel is not provided");
    return;
  }

  console.log(
    "New subscription: %s; Existing subscription to cancel: %s",
    subscriptionData.params.itemId,
    subscriptionToCancel.params.itemId
  );

  await acknowledge(subscriptionData);

  const cancellationMode = await cancel(subscriptionToCancel);
  const changeAction: PurchaseAction =
    subscriptionToCancel.params.itemId === "guitar_upscale.composer"
      ? "Downgrade"
      : "Upgrade";
  const isDowngradeWithCancellation =
    cancellationMode === CancellationMode.Cancel &&
    changeAction === "Downgrade";
  let newTier: Tier;
  let tierChanged: boolean;

  let wasDeferred: boolean = false;

  if (isDowngradeWithCancellation) {
    // If downgraded, but the old subscription was not revoked immediately - keep the old permissions until they expire

    newTier = "Composer";
    tierChanged = false;
    // Downgrading - defer the new subscription to avoid overlap

    // this is the same as cancelled subscription expiry time
    wasDeferred = await defer(subscriptionToCancel, subscriptionData);
  } else {
    // upgrade or downgrade with revoke - change tier according to the new subscription
    await setSubscriptionCookie(subscriptionData.params, req, res);

    newTier = changeAction === "Downgrade" ? "Explorer" : "Composer";
    tierChanged = true;
  }

  res.status(HttpStatusCode.Ok).json({
    message: "Changed",
    changeAction,
    wasDeferred,
    newTier,
    tierChanged,
  } as GetPurchaseResponseData);
};

export default apiHandler({
  POST: handle,
});
