import { apiHandler } from "@/lib/apiHelper";
import { CancellationMode, PurchaseResponseData } from "@/lib/apiTypes";
import {
  getSubscriptionFromRequest,
  shouldRevoke,
} from "@/lib/subscriptionHelper";
import { HttpStatusCode } from "axios";
import type { NextApiRequest, NextApiResponse } from "next";

const handle = async (
  req: NextApiRequest,
  res: NextApiResponse<PurchaseResponseData>
) => {
  try {
    // we should grant permissions even if the subscription is cancelled - it is valid until its expiration period
    const subscriptionData = await getSubscriptionFromRequest(req, res, true);
    if (!subscriptionData) {
      return;
    }
    const subscription = subscriptionData.subscription;
    res.status(HttpStatusCode.Ok).json({
      message: "Subscription details",
      data: {
        cancellationReason: subscription.cancelReason,
        cancellationMode: shouldRevoke(subscription)
          ? CancellationMode.Revoke
          : CancellationMode.Cancel,
        expirationDateMs: subscription.expiryTimeMillis,
        subscribedDateMs: subscription.startTimeMillis,
      },
    });
  } finally {
    res.end();
  }
};

export default apiHandler({
  GET: handle,
});
