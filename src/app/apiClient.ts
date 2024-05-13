import { PurchaseParams } from "@/lib/purchaseParams";

export enum AcknowledgeResult {
  Success,
  Error,
}

export async function acknowledgePurchasesOnBackend(
  paramsList: PurchaseParams[]
): Promise<AcknowledgeResult> {
  try {
    const response = await fetch(`/api/purchases/acknowledge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paramsList }),
    });

    if (!response.ok) {
      const responseData = await response.json(); // Extract error message from response
      console.log("Error while acknowledging subscriptions", responseData);
      return AcknowledgeResult.Error;
    }

    return AcknowledgeResult.Success;
  } catch (error: any) {
    console.log("Error while acknowledging subscriptions", error);
    return AcknowledgeResult.Error;
  }
}
