/* Cancel Flow:
1) If the subscription is in grace period then it can be revoked (it will be refunded straight away). In this case the subscription cookie is deleted straight away
2) Otherwise it will be cancelled but will remain active until its expiration time. It won't be renewed after that. In this case the subscription cookie stays intact and will be removed by the permissions mismatch check
*/

import { apiHandler } from "@/lib/apiHelper";
import { CancellationMode, ResponseData } from "@/lib/apiTypes";
import { cancelSubscription, revokeSubscription } from "@/lib/purchases";
import {
  SubscriptionData,
  getSubscriptionFromRequest,
  shouldRevoke,
} from "@/lib/subscriptionHelper";
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

const handle = async (
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) => {
  try {
    const subscriptionData = await getSubscriptionFromRequest(req, res, false);
    if (!subscriptionData) {
      return undefined;
    }
    const mode = await cancel(subscriptionData);
    if (!mode) {
      return;
    }
    if (mode === CancellationMode.Revoke) {
      clearSubscriptionCookie(req, res);
    }

    res
      .status(HttpStatusCode.Ok)
      .json({
        message: mode === CancellationMode.Revoke ? "Revoked" : "Cancelled",
      });
  } finally {
    res.end();
  }
};

export default apiHandler({
  POST: handle,
});
