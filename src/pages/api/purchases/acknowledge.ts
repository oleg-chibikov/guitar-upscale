import { apiHandler } from "@/lib/apiHelper";
import { SubscriptionPurchase } from "@/lib/billing";
import { googlePlaySession } from "@/lib/googlePlaySession";
import { PurchaseParams } from "@/lib/purchaseParams";
import {
  acknowledgeSubscriptionPurchase,
  fetchSubscriptionPurchase,
} from "@/lib/purchases";
import { TierKey } from "@/lib/tiers";
import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
  subscription?: SubscriptionPurchase;
  error?: string;
};

function validateParameter<T>(
  param: unknown,
  paramName: string,
  res: NextApiResponse
): T | null {
  if (typeof param !== "string") {
    res.status(400).json({ error: `Parameter ${paramName} must be a string.` });
    return null; // Validation failed
  }
  return param as T; // Validation passed
}

const saveSubscriptionInSession = async (
  params: PurchaseParams,
  req: NextApiRequest
) => {
  await googlePlaySession(req).setAll(params);
  console.log("Subscription set in session", params);
};

const handle = async (
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) => {
  try {
    const itemId = validateParameter<TierKey>(req.query.itemId, "itemId", res);

    const purchaseToken = validateParameter<string>(
      req.query.purchaseToken,
      "purchaseToken",
      res
    );

    if (itemId === null || purchaseToken === null) {
      return; // Exit early if validation fails
    }

    const params: PurchaseParams = { itemId, purchaseToken };
    const subscription = await fetchSubscriptionPurchase(params);
    const wasAcknowledged = subscription?.wasAcknowledged();
    console.log("Subscription acknowdegement state", wasAcknowledged);
    // TODO: Validate subscription somehow (we might need to store users and subscriptions in the db)

    if (!wasAcknowledged) {
      await acknowledgeSubscriptionPurchase(params);
    }

    await saveSubscriptionInSession(params, req);
    res.status(200);
  } finally {
    res.end();
  }
};

export default apiHandler({
  POST: handle,
});
