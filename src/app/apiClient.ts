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
    if (!response.ok) {
      throw new Error("Failed to fetch subscription purchase");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}
