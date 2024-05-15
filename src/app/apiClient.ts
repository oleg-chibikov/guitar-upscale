import { CancelReason } from "@/lib/billing";
import { PurchaseParams } from "@/lib/purchaseParams";
import { HttpStatusCode } from "axios";

export type Response<T> = {
  status: ApiCallResult;
  data?: T;
};

export enum ApiCallResult {
  Success,
  SkipProcessing,
  Error,
}

async function callApi<T>(
  endpoint: string,
  method: string,
  params?: Record<string, string>
): Promise<Response<T>> {
  try {
    const queryString = params ? `?${new URLSearchParams(params)}` : "";
    const response = await fetch(`${endpoint}${queryString}`, {
      method,
    });

    if (!response.ok) {
      if (response.status === HttpStatusCode.Gone) {
        return { status: ApiCallResult.SkipProcessing };
      }

      const responseData = await response.json(); // Extract error message from response
      console.error(
        `Error status received while calling ${endpoint}`,
        responseData
      );
      return { status: ApiCallResult.Error, data: responseData };
    }

    const responseData = await response.json(); // Extract error message from response
    return { status: ApiCallResult.Success, data: responseData as T };
  } catch (error: any) {
    console.error(`Exception happened while calling ${endpoint}`, error);
    return { status: ApiCallResult.Error, data: error };
  }
}

export async function acknowledgePurchaseOnBackend(
  params: PurchaseParams
): Promise<Response<void>> {
  const { itemId, purchaseToken } = params;
  return callApi(`/api/purchases/acknowledge`, "POST", {
    itemId,
    purchaseToken,
  });
}

export async function cancelSubscriptionOnBackend(
  params: PurchaseParams
): Promise<Response<void>> {
  const { itemId, purchaseToken } = params;
  return callApi(`/api/purchases/cancel`, "POST", {
    itemId,
    purchaseToken,
  });
}

export async function logoutOnBackend(): Promise<Response<void>> {
  return callApi(`/api/purchases/logout`, "POST");
}

export async function getSubscriptionCancellationReasonOnBackend(): Promise<
  Response<CancelReason>
> {
  return callApi(`/api/purchases/getCancellationReason`, "GET");
}
