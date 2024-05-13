import { apiHandler } from "@/lib/apiHelper";
import { SubscriptionPurchase } from "@/lib/billing";
import { PurchaseParams, setSubscriptionCookie } from "@/lib/purchaseParams";
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

    console.log("Getting subscription");

    const subscription = await fetchSubscriptionPurchase(params);

    console.log("Got subscription", subscription);

    // TODO: Validate subscription somehow (we might need to store users and subscriptions in the db)

    console.log("Acknowledging subscription");
    await acknowledgeSubscriptionPurchase(params);

    // TODO: After sub is acknowledged we need to grant the necessary permissions (set the subscription tier like Patreon does). Can we make sure sub belongs to the user without storing the users here?
    // We need to add some state to make sure subscription.ts / getTierName uses it. This state should be also set when the app loads

    console.log("Acknowledged subscription");
    setSubscriptionCookie(params, req, res);
    res.status(200);
  } finally {
    res.end(); // End the response
  }
};

export default apiHandler({
  POST: handle,
});
