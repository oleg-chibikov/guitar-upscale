import { PurchaseResponseData, ResponseData } from "@/lib/apiTypes";
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

    const responseData = await response.json(); // Extract error message from response
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
  } catch (error: any) {
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
