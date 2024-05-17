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

    // if the old subscription is already cancelled - don't proceed with the operation. Client should use acknowledge endpoint in this case
    const subscriptionToCancel = await getSubscriptionFromRequest(
      req,
      res,
      false,
      { itemId: "oldItemId", purchaseToken: "oldPurchaseToken" }
    );

    console.log(
      "New subscription: %o; Existing subscription to cancel: %o",
      subscriptionData,
      subscriptionToCancel
    );

    if (!subscriptionToCancel) {
      console.error("Subscription to cancel is not provided");
      return;
    }

    await acknowledge(subscriptionData);

    const cancellationMode = await cancel(subscriptionToCancel);
    if (
      cancellationMode === CancellationMode.Cancel &&
      subscriptionToCancel.params.itemId === "guitar_upscale.composer"
    ) {
      // Downgrading - defer the new subscription to avoid overlap
      const newSubscriptionCurrentExpiryTime =
        subscriptionData.subscription.expiryTimeMillis;
      const cancelledSubscriptionExpiryTime =
        subscriptionToCancel.subscription.expiryTimeMillis;
      const currentSubscriptionDuration =
        subscriptionData.subscription.expiryTimeMillis -
        subscriptionData.subscription.startTimeMillis;
      const newSubscriptionDesiredExpiryTime =
        cancelledSubscriptionExpiryTime + currentSubscriptionDuration;
      const expiryTimeDifference =
        cancelledSubscriptionExpiryTime - newSubscriptionCurrentExpiryTime;
      const differnceObject = msToTime(expiryTimeDifference);
      console.log(
        "Deferrning subscription %s. New subscription current expiry time: %o, new subscription desired expiry time: %o, cancelled subscription expiry time: %o, new subscription duration: %o, new subscription expiry time difference: %o",
        subscriptionData.params.itemId,
        new Date(newSubscriptionCurrentExpiryTime),
        new Date(newSubscriptionDesiredExpiryTime),
        new Date(cancelledSubscriptionExpiryTime),
        msToTime(currentSubscriptionDuration),
        differnceObject
      );
      if (differnceObject.days >= 1 && differnceObject.days <= 365) {
        await deferSubscription(
          subscriptionData.params,
          subscriptionData.subscription.expiryTimeMillis,
          newSubscriptionDesiredExpiryTime
        );
      } else {
        // https://developer.android.com/google/play/billing/subscriptions#defer
        console.log(
          "Differnce in expiry time should be between 1 day and 1 year. Subscription won't be deferred"
        );
      }
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
