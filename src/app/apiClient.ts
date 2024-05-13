import { PurchaseParams } from "@/lib/purchaseParams";

export enum AcknowledgeResult {
  Success,
  Error,
}

export async function acknowledgePurchaseOnBackend(
  params: PurchaseParams
): Promise<AcknowledgeResult> {
  const { itemId, purchaseToken } = params;
  try {
    const response = await fetch(
      `/api/purchases/acknowledge?itemId=${itemId}&purchaseToken=${purchaseToken}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const responseData = await response.json(); // Extract error message from response
      console.error("Error while acknowledging purchase", responseData);
      return AcknowledgeResult.Error;
    }

    return AcknowledgeResult.Success;
  } catch (error: any) {
    console.error("Error while acknowledging purchase", error);
    return AcknowledgeResult.Error;
  }
}
