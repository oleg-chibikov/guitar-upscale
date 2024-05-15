import { apiHandler } from "@/lib/apiHelper";
import { CancelReason } from "@/lib/billing";
import { getSubscriptionFromRequest } from "@/lib/subscriptionHelper";
import { HttpStatusCode } from "axios";
import type { NextApiRequest, NextApiResponse } from "next";

const handle = async (
  req: NextApiRequest,
  res: NextApiResponse<CancelReason>
) => {
  try {
    // we should grant permissions even if the subscription is cancelled - it is valid until its expiration period
    const subscriptionData = await getSubscriptionFromRequest(req, res, true);
    if (!subscriptionData) {
      return;
    }
    res
      .status(HttpStatusCode.Ok)
      .json(subscriptionData.subscription.cancelReason);
  } finally {
    res.end();
  }
};

export default apiHandler({
  GET: handle,
});
