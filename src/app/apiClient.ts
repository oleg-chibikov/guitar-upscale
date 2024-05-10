import { PurchaseParams } from "@/lib/subscriptionTypes";

export async function acknowldegeSubscriptionOnBackend(
  params: PurchaseParams
): Promise<any> {
  const { itemId, purchaseToken } = params;

  try {
    const response = await fetch(
      `/api/googlePlayBillingSubscription?itemId=${itemId}&purchaseToken=${purchaseToken}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const responseData = await response.json(); // Extract error message from response
    const responseAsString = JSON.stringify(responseData);

    if (!response.ok) {
      return {
        error: responseAsString,
      };
    }

    return { result: responseAsString };
  } catch (error: any) {
    // Construct a custom error message
    return {
      error: JSON.stringify(error),
    };
  }
}
