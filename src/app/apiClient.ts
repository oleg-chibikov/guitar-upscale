import { PurchaseParams } from "@/lib/purchaseParams";

export enum ApiCallResult {
  Success,
  Error,
}

async function callApi(
  endpoint: string,
  method: string,
  params?: Record<string, string>
): Promise<ApiCallResult> {
  try {
    const queryString = params ? `?${new URLSearchParams(params)}` : "";
    const response = await fetch(`${endpoint}${queryString}`, {
      method,
    });

    if (!response.ok) {
      const responseData = await response.json(); // Extract error message from response
      console.error(
        `Error status received while calling ${endpoint}`,
        responseData
      );
      return ApiCallResult.Error;
    }

    return ApiCallResult.Success;
  } catch (error: any) {
    console.error(`Exception happened while calling ${endpoint}`, error);
    return ApiCallResult.Error;
  }
}

export async function acknowledgePurchaseOnBackend(
  params: PurchaseParams
): Promise<ApiCallResult> {
  const { itemId, purchaseToken } = params;
  return callApi(`/api/purchases/acknowledge`, "POST", {
    itemId,
    purchaseToken,
  });
}

export async function clearSubscriptionCookieOnBackend(): Promise<ApiCallResult> {
  return callApi(`/api/purchases/logout`, "POST");
}
