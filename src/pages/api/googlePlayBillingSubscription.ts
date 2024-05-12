import { apiHandler } from "@/lib/apiHelper";
import { SubscriptionPurchase } from "@/lib/billing";
import type { NextApiRequest, NextApiResponse } from "next";
import {
  acknowledgeSubscriptionPurchase,
  fetchSubscriptionPurchase,
} from "../../lib/purchases";
import { PurchaseParams } from "../../lib/subscriptionTypes";

type ResponseData = {
  subscription?: SubscriptionPurchase;
  error?: string;
};

function validateParameter(
  param: unknown,
  paramName: string,
  res: NextApiResponse
): string | null {
  if (typeof param !== "string") {
    res.status(400).json({ error: `Parameter ${paramName} must be a string.` });
    return null; // Validation failed
  }
  return param as string; // Validation passed
}

const handle = async (
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) => {
  const itemId = validateParameter(req.query.itemId, "itemId", res);

  const purchaseToken = validateParameter(
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

  res.status(200).json({ subscription: subscription ?? undefined });
  res.end(); // End the response
};

export default apiHandler({
  POST: handle,
});
