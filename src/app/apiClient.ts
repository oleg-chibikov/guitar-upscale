import {
  ChangeSubscriptionActionResponseData,
  GetPurchaseResponseData,
  ResponseData,
  SubscriptionActionResponseData,
} from "@/lib/apiTypes";
import { PurchaseParams } from "@/lib/purchaseParams";
import axios, {
  AxiosError,
  AxiosResponse,
  HttpStatusCode,
  Method,
} from "axios";

export type Response<T extends ResponseData> =
  | {
      status: ApiCallResult.Success;
      data: Omit<T, "error">;
    }
  | {
      status: ApiCallResult.SkipProcessing | ApiCallResult.Error;
      data: { error?: string };
    };

export enum ApiCallResult {
  Success,
  SkipProcessing,
  Error,
}

const callApi = async <T extends ResponseData>(
  endpoint: string,
  method: Method,
  params?: Record<string, unknown>,
): Promise<Response<T>> => {
  try {
    const options = {
      method,
      url: endpoint,
      headers: {
        "Content-Type": "application/json",
      },
      // Add params to the body if the method is not GET
      ...(method !== "GET" && { data: params }),
      // Add params to the query string if the method is GET
      ...(method === "GET" && { params }),
    };

    const response: AxiosResponse<T> = await axios(options);

    console.log(`Successfully called ${endpoint}`, response.data);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { error, ...rest } = response.data;
    return {
      status: ApiCallResult.Success,
      data: rest,
    };
  } catch (error) {
    const axiosError = error as AxiosError<T>;

    if (axiosError.response) {
      const responseData = axiosError.response.data;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { error, ...rest } = responseData;
      if (axiosError.response.status === HttpStatusCode.Gone) {
        return { status: ApiCallResult.SkipProcessing, data: { error } };
      }

      console.error(
        `Error status received while calling ${endpoint}`,
        responseData,
      );
      return { status: ApiCallResult.Error, data: { error } };
    }

    console.error(`Exception happened while calling ${endpoint}`, error);
    return { status: ApiCallResult.Error, data: { error: "Unknown error" } };
  }
};

export async function acknowledgePurchaseOnBackend(
  params: PurchaseParams,
  anotherCancelledSubscriptionParams?: PurchaseParams, // there might be another cancelled subscription when we acknowledge a subscription. We need to make sure its tier is taken into account
): Promise<Response<ChangeSubscriptionActionResponseData>> {
  const { itemId, purchaseToken } = params;
  const {
    itemId: cancelledSubscriptionItemId,
    purchaseToken: cancelledSubscriptionPurchaseToken,
  } = anotherCancelledSubscriptionParams ?? {};
  return callApi(`/api/purchases/acknowledge`, "POST", {
    itemId,
    purchaseToken,
    cancelledSubscriptionItemId,
    cancelledSubscriptionPurchaseToken,
  });
}

export async function changePurchaseOnBackend(
  newParams: PurchaseParams,
  oldParams: PurchaseParams,
): Promise<Response<ChangeSubscriptionActionResponseData>> {
  // We don't check for any other cancelled subscriptions currently - we just have 2 options and both of them should be already passed to this method as newParams and oldParams
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
  params: PurchaseParams,
  anotherCancelledSubscriptionParams?: PurchaseParams, // there might be another cancelled subscription when we cancel a subscription. We need to make sure its tier is taken into account
): Promise<Response<SubscriptionActionResponseData>> {
  const { itemId, purchaseToken } = params;
  const {
    itemId: cancelledSubscriptionItemId,
    purchaseToken: cancelledSubscriptionPurchaseToken,
  } = anotherCancelledSubscriptionParams ?? {};
  return callApi(`/api/purchases/cancel`, "POST", {
    itemId,
    purchaseToken,
    cancelledSubscriptionItemId,
    cancelledSubscriptionPurchaseToken,
  });
}

export async function logoutOnBackend(): Promise<Response<ResponseData>> {
  return callApi(`/api/purchases/logout`, "POST");
}

export async function getPurchaseOnBackend(
  params: PurchaseParams,
): Promise<Response<GetPurchaseResponseData>> {
  const { itemId, purchaseToken } = params;
  return callApi(`/api/purchases/get`, "GET", {
    itemId,
    purchaseToken,
  });
}
