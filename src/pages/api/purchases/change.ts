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
  ChangeAction,
  ChangeResponseData,
} from "@/lib/apiTypes";
import { msToTime } from "@/lib/dateHelper";
import { deferSubscription } from "@/lib/purchases";
import { getSubscriptionFromRequest } from "@/lib/subscriptionHelper";
import { Tier } from "@/lib/tier";
import { HttpStatusCode } from "axios";
import type { NextApiRequest, NextApiResponse } from "next";
import { acknowledge, setSubscriptionCookie } from "./acknowledge";
import { cancel } from "./cancel";

const handle = async (
  req: NextApiRequest,
  res: NextApiResponse<ChangeResponseData>
) => {
  try {
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

    let wasDeferred: boolean = false;

    // this is the same as cancelled subscription expiry time
    const newSubscriptionDesiredStartTimeMs =
      subscriptionToCancel.subscription.expiryTimeMillis;

    let newSubscriptionDesiredExpiryTimeMs =
      subscriptionData.subscription.expiryTimeMillis;

    const cancellationMode = await cancel(subscriptionToCancel);
    const changeAction: ChangeAction =
      subscriptionToCancel.params.itemId === "guitar_upscale.composer"
        ? "Downgrade"
        : "Upgrade";
    const isDowngradeWithCancellation =
      cancellationMode === CancellationMode.Cancel &&
      changeAction === "Downgrade";
    let newTier: Tier;
    let tierChanged: boolean;

    if (isDowngradeWithCancellation) {
      // If downgraded, but the old subscription was not revoked immediately - keep the old permissions until they expire

      newTier = "Composer";
      tierChanged = false;
      // Downgrading - defer the new subscription to avoid overlap

      const newSubscriptionCurrentExpiryTimeMs =
        subscriptionData.subscription.expiryTimeMillis;

      const currentSubscriptionDurationMs =
        subscriptionData.subscription.expiryTimeMillis -
        subscriptionData.subscription.startTimeMillis;

      newSubscriptionDesiredExpiryTimeMs =
        newSubscriptionDesiredStartTimeMs + currentSubscriptionDurationMs;

      const expiryTimeDifference =
        newSubscriptionDesiredExpiryTimeMs - newSubscriptionCurrentExpiryTimeMs;

      const differnceObject = msToTime(expiryTimeDifference);
      console.log(
        `Deferrning subscription %s;
        desired start time: %o;
        desired expiry time: %o;
        current expiry time: %o,
        duration: %o;
        expiry time difference: %o`,
        subscriptionData.params.itemId,
        new Date(newSubscriptionDesiredStartTimeMs),
        new Date(newSubscriptionDesiredExpiryTimeMs),
        new Date(newSubscriptionCurrentExpiryTimeMs),
        msToTime(currentSubscriptionDurationMs),
        differnceObject
      );
      if (differnceObject.days >= 1 && differnceObject.days <= 365) {
        try {
          await deferSubscription(
            subscriptionData.params,
            subscriptionData.subscription.expiryTimeMillis,
            newSubscriptionDesiredExpiryTimeMs
          );
          wasDeferred = true;
        } catch (error: unknown) {
          wasDeferred = false;
        }
      } else {
        // https://developer.android.com/google/play/billing/subscriptions#defer
        console.log(
          "Differnce in expiry time should be between 1 day and 1 year. Subscription won't be deferred"
        );
      }
    } else {
      // upgrade or downgrade with revoke - change tier according to the new subscription
      setSubscriptionCookie(subscriptionData.params, req, res);

      newTier = changeAction === "Downgrade" ? "Explorer" : "Composer";
      tierChanged = true;
    }

    res.status(HttpStatusCode.Ok).json({
      message: "Changed",
      changeAction,
      wasDeferred,
      newTier,
      tierChanged,
    } as ChangeResponseData);
  } finally {
    res.end();
  }
};

export default apiHandler({
  POST: handle,
});
