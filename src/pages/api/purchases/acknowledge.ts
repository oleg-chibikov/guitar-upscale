import { apiHandler } from "@/lib/apiHelper";
import { SubscriptionPurchase } from "@/lib/billing";
import type { NextApiRequest, NextApiResponse } from "next";
import { PurchaseParams } from "../../../lib/purchaseParams";
import {
  acknowledgeSubscriptionPurchase,
  fetchSubscriptionPurchase,
} from "../../../lib/purchases";

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
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({
      error: "Invalid request body. 'items' array is missing or empty.",
    });
    return;
  }

  const purchaseParamsList: PurchaseParams[] = [];

  for (const item of items) {
    const itemId = validateParameter(item.itemId, "itemId", res);
    const purchaseToken = validateParameter(
      item.purchaseToken,
      "purchaseToken",
      res
    );

    if (itemId === null || purchaseToken === null) {
      return; // Exit early if validation fails for any item
    }

    const params: PurchaseParams = { itemId, purchaseToken };
    purchaseParamsList.push(params);
  }

  console.log("Getting subscription");

  const subscriptionPromises = purchaseParamsList.map(
    fetchSubscriptionPurchase
  );
  const subscriptions = await Promise.all(subscriptionPromises);

  console.log("Got subscriptions", subscriptions);

  // Assuming acknowledgeSubscriptionPurchase can handle multiple subscriptions at once
  console.log("Acknowledging subscriptions");
  const acknowledgePromises = purchaseParamsList.map(
    acknowledgeSubscriptionPurchase
  );
  await Promise.all(acknowledgePromises);

  console.log("Acknowledged subscriptions");

  res.status(200);
};

export default apiHandler({
  POST: handle,
});
