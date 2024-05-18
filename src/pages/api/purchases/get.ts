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
  const subscriptionData = await getSubscriptionFromRequest(req, res, {
    allowCancelled: true,
    required: true,
  });
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
};

export default apiHandler({
  GET: handle,
});
