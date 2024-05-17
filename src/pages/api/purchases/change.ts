/* Upgrade/downgrade Flow:
1) We are passing all the purchased subscriptions with their tokens and itemIds
2) We try the revoke the other subscriptions. If revoked (and refunded) - we just apply the new one
3) If the revoke cannot be applied (grace period is over) then we have 2 paths:
    a) downgrade - still use the Composer while active, defer Explorer to avoid overlap
    b) upgrade - new permissions should fire straight away, the old subscription will just last till its end
*/

import { apiHandler } from "@/lib/apiHelper";
import { CancellationMode, ResponseData } from "@/lib/apiTypes";
import { msToTime } from "@/lib/dateHelper";
import { deferSubscription } from "@/lib/purchases";
import { getSubscriptionFromRequest } from "@/lib/subscriptionHelper";
import { HttpStatusCode } from "axios";
import type { NextApiRequest, NextApiResponse } from "next";
import { acknowledge, setSubscriptionCookie } from "./acknowledge";
import { cancel } from "./cancel";

const handle = async (
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) => {
  try {
    const subscriptionData = await getSubscriptionFromRequest(req, res, false);
    if (!subscriptionData) {
      return;
    }

    acknowledge(subscriptionData);

    // if the old subscription is already cancelled - don't proceed with the operation. Client should use acknowledge ednpoint in this case
    const subscriptionToCancel = await getSubscriptionFromRequest(
      req,
      res,
      false,
      "oldItemId",
      "oldPurchaseToken"
    );

    if (!subscriptionToCancel) {
      return;
    }

    let cancellationMode = await cancel(subscriptionToCancel);
    if (
      cancellationMode === CancellationMode.Cancel &&
      subscriptionToCancel.params.itemId === "guitar_upscale.composer"
    ) {
      // Downgrading - defer the new subscription to avoid overlap
      const cancelledSubscriptionExpiryTime =
        subscriptionToCancel.subscription.expiryTimeMillis;
      const currentSubscriptionDuration =
        subscriptionData.subscription.expiryTimeMillis -
        subscriptionData.subscription.startTimeMillis;
      const newSubscriptionDesiredExpiryTime =
        cancelledSubscriptionExpiryTime + currentSubscriptionDuration;

      console.log(
        "Deferrning subscription %s. New expiry time: %o. Duration: %o, cancelled subscription expiry time is: %o",
        subscriptionData.params.itemId,
        new Date(newSubscriptionDesiredExpiryTime),
        msToTime(currentSubscriptionDuration),
        new Date(cancelledSubscriptionExpiryTime)
      );

      await deferSubscription(
        subscriptionData.params,
        subscriptionData.subscription.expiryTimeMillis,
        newSubscriptionDesiredExpiryTime
      );
    }

    setSubscriptionCookie(subscriptionData.params, req, res);

    res.status(HttpStatusCode.Ok).json({ message: "Changed" });
  } finally {
    res.end();
  }
};

export default apiHandler({
  POST: handle,
});
