import { PurchaseResponseData, ResponseData } from "@/lib/apiTypes";
import { PurchaseParams } from "@/lib/purchaseParams";
import { HttpStatusCode } from "axios";

export type Response<T> =
  | {
      status: ApiCallResult.Success;
      data?: T;
    }
  | {
      status: ApiCallResult.SkipProcessing | ApiCallResult.Error;
      data?: unknown;
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
    console.log("Calling API: ", queryString);
    const response = await fetch(`${endpoint}${queryString}`, {
      method,
    });

    const responseData = await response.json(); // Extract error message from response. It means that API should produce JSON for any result, otherwise it would fail
    if (!response.ok) {
      if (response.status === HttpStatusCode.Gone) {
        return { status: ApiCallResult.SkipProcessing, data: responseData };
      }

      console.error(
        `Error status received while calling ${endpoint}`,
        responseData
      );
      return { status: ApiCallResult.Error, data: responseData };
    }

    console.log(`Successfully called ${endpoint}`, responseData);
    return { status: ApiCallResult.Success, data: responseData };
  } catch (error: unknown) {
    console.error(`Exception happened while calling ${endpoint}`, error);
    return { status: ApiCallResult.Error, data: error };
  }
}

export async function acknowledgePurchaseOnBackend(
  params: PurchaseParams
): Promise<Response<ResponseData>> {
  const { itemId, purchaseToken } = params;
  return callApi(`/api/purchases/acknowledge`, "POST", {
    itemId,
    purchaseToken,
  });
}

export async function changePurchaseOnBackend(
  newParams: PurchaseParams,
  oldParams: PurchaseParams
): Promise<Response<ResponseData>> {
  const { itemId, purchaseToken } = newParams;
  const { itemId: oldItemId, purchaseToken: oldPurchaseToken } = oldParams;
  return callApi(`/api/purchases/change`, "POST", {
    itemId,
    purchaseToken,
    oldItemId,
    oldPurchaseToken,
  });
}

export async function cancelPurchaseOnBackend(
  params: PurchaseParams
): Promise<Response<ResponseData>> {
  const { itemId, purchaseToken } = params;
  return callApi(`/api/purchases/cancel`, "POST", {
    itemId,
    purchaseToken,
  });
}

export async function logoutOnBackend(): Promise<Response<ResponseData>> {
  return callApi(`/api/purchases/logout`, "POST");
}

export async function getPurchaseOnBackend(
  params: PurchaseParams
): Promise<Response<PurchaseResponseData>> {
  const { itemId, purchaseToken } = params;
  return callApi(`/api/purchases/get`, "GET", {
    itemId,
    purchaseToken,
  });
}
