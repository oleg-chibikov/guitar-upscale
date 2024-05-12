import { google } from "googleapis";
import * as billing from "./billing";
import { PurchaseParams } from "./subscriptionTypes";

//https://developers.google.com/android-publisher/api-ref/rest
//https://cloud.google.com/nodejs/docs/reference/google-auth-library/latest

// TODO: Client should be setup once in the init. See nextjs instrumentation thing
const setupClient = async () => {
  console.log("Setting up client");

  const jwtClient = new google.auth.JWT(
    process.env.GOOGLE_CLIENT_EMAIL,
    undefined,
    process.env.GOOGLE_PRIVATE_KEY!.split(String.raw`\n`).join("\n"),
    ["https://www.googleapis.com/auth/androidpublisher"]
  );

  // Connect to the Google Play Developer API with JWT Client
  const playApi = google.androidpublisher({
    version: "v3",
    auth: jwtClient,
  });

  return playApi;
};

/**
 *  Acknowledge an in-app item purchase with Play Developer API.
 *
 * @param {params} PurchaseParams
 * @return {(Promise<boolean>)} whether the acknowledgement of the in-app purchase was successful
 */
export async function acknowledgeInAppPurchase(
  params: PurchaseParams
): Promise<boolean> {
  try {
    const playApi = await setupClient();
    const apiResponse = (
      await playApi.purchases.products.acknowledge({
        packageName: process.env.ANDROID_PACKAGE_ID,
        productId: params.itemId,
        token: params.purchaseToken,
      })
    )?.data;
    if (JSON.stringify(apiResponse) === `""`) {
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error acknowledging in-app purchase : ${error}`);
    throw error;
  }
}

/**
 * Acknowledge a subscription purchase with  Play Developer API.
 * @param {params} PurchaseParams
 * @return {(Promise<boolean>)} whether the acknowledgement of the subscription purchase was successful
 */
export async function acknowledgeSubscriptionPurchase(
  params: PurchaseParams
): Promise<boolean> {
  try {
    const playApi = await setupClient();
    const apiResponse = (
      await playApi.purchases.subscriptions.acknowledge({
        packageName: process.env.ANDROID_PACKAGE_ID,
        subscriptionId: params.itemId,
        token: params.purchaseToken,
      })
    )?.data;
    if (JSON.stringify(apiResponse) === `""`) {
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error acknowledging subscription purchase : ${error}`);
    throw error;
  }
}

/**
 *  Fetch a purchase from the Play Developer API and validate that it has not been consumed already.
 *
 * @param {params} PurchaseParams
 */
export async function fetchPurchase(
  params: PurchaseParams
): Promise<billing.Purchase | null> {
  try {
    const playApi = await setupClient();
    const apiResponse = (
      await playApi.purchases.products.get({
        packageName: process.env.ANDROID_PACKAGE_ID,
        productId: params.itemId,
        token: params.purchaseToken,
      })
    )?.data;
    console.log(
      `PlayAPI Response : ${JSON.stringify(apiResponse, undefined, 2)}`
    );
    return billing.Purchase.fromApiResponse(
      apiResponse,
      params.purchaseToken,
      params.itemId
    );
  } catch (error) {
    console.error(`Error fetching purchase info : ${error}`);
    throw error;
  }
}

/**
 * Fetch full subscription purchase details from Play Developer API.
 * @param {params} PurchaseParams
 */
export async function fetchSubscriptionPurchase(
  params: PurchaseParams
): Promise<billing.SubscriptionPurchase | null> {
  try {
    const playApi = await setupClient();
    const apiResponse = (
      await playApi.purchases.subscriptions.get({
        packageName: process.env.ANDROID_PACKAGE_ID,
        subscriptionId: params.itemId,
        token: params.purchaseToken,
      })
    )?.data;
    console.log(
      `PlayAPI Response : ${JSON.stringify(apiResponse, undefined, 2)}`
    );
    return billing.SubscriptionPurchase.fromApiResponse(
      apiResponse,
      params.purchaseToken
    );
  } catch (error) {
    console.error(`Error fetching subscription purchase info : ${error}`);
    throw error;
  }
}
