"use server";
import type { NextApiRequest, NextApiResponse } from "next";
import {
  acknowledgeSubscriptionPurchase,
  fetchSubscriptionPurchase,
} from "./purchases";
import { PurchaseParams } from "./subscriptionTypes";

type ResponseData = {
  message?: string;
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

  if (req.method === "POST") {
    console.log("Acknowledging subscription");
    await acknowledgeSubscriptionPurchase(params);
    console.log("Acknowledged subscription");
  }

  res.status(200).json({ message: subscription?.productId });
  res.end(); // End the response
};

export default handle;
