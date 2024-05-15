import { ResponseData, apiHandler } from "@/lib/apiHelper";
import { cancelSubscription, revokeSubscription } from "@/lib/purchases";
import { getSubscriptionFromRequest } from "@/lib/subscriptionHelper";
import { HttpStatusCode } from "axios";
import type { NextApiRequest, NextApiResponse } from "next";
import { clearSubscriptionCookie } from "./logout";

const handle = async (
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) => {
  try {
    const subscriptionData = await getSubscriptionFromRequest(req, res, false);
    if (!subscriptionData) {
      return;
    }
    const { subscription, params } = subscriptionData;

    let message: string = "Cancelled";
    if (subscription.isGracePeriod()) {
      console.log(
        "Subscription is still in grace period. Revoking permissions",
        params
      );
      await revokeSubscription(params);
      clearSubscriptionCookie(req, res);
      message = "Revoked";
    } else {
      console.log(
        "Subscription is not in grace period anymore. Keeping permissions",
        params
      );
      await cancelSubscription(params);
      // we should keep the permissions. it will be revoked only when the subscription expires
    }

    res.status(HttpStatusCode.Ok).json({ message: message });
  } finally {
    res.end();
  }
};

export default apiHandler({
  POST: handle,
});
