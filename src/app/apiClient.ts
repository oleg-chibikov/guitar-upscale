import { PurchaseParams } from "@/lib/purchaseParams";

export enum AcknowledgeResult {
  Success,
  Error,
}

export async function acknowldegeSubscriptionOnBackend(
  params: PurchaseParams
): Promise<AcknowledgeResult> {
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

    if (!response.ok) {
      const responseData = await response.json(); // Extract error message from response
      console.log("Error while purchasing", responseData);
      return AcknowledgeResult.Error;
    }

    return AcknowledgeResult.Success;
  } catch (error: any) {
    console.log("Error while purchasing", error);
    // Construct a custom error message
    return AcknowledgeResult.Error;
  }
}
