import { PurchaseResponseData, ResponseData } from "@/lib/apiTypes";
import { PurchaseParams } from "@/lib/purchaseParams";
import axios, {
  AxiosError,
  AxiosResponse,
  HttpStatusCode,
  Method,
} from "axios";

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

const callApi = async <T>(
  endpoint: string,
  method: Method,
  params?: Record<string, unknown>
): Promise<Response<T>> => {
  try {
    const options = {
      method,
      url: endpoint,
      headers: {
        "Content-Type": "application/json",
      },
      data: params,
    };

    const response: AxiosResponse<T> = await axios(options);

    console.log(`Successfully called ${endpoint}`, response.data);
    return { status: ApiCallResult.Success, data: response.data };
  } catch (error) {
    const axiosError = error as AxiosError;
    const responseData = axiosError.response?.data;

    if (axiosError.response) {
      if (axiosError.response.status === HttpStatusCode.Gone) {
        return { status: ApiCallResult.SkipProcessing, data: responseData };
      }

      console.error(
        `Error status received while calling ${endpoint}`,
        responseData
      );
      return { status: ApiCallResult.Error, data: responseData };
    }

    console.error(`Exception happened while calling ${endpoint}`, error);
    return { status: ApiCallResult.Error, data: error };
  }
};

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
