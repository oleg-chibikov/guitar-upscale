import { google } from "googleapis";
import * as billing from "./billing";
import { PurchaseParams } from "./purchaseParams";
import { fromSubscriptionPurchaseV2 } from "./subscriptionPurchaseV2";

//https://developers.google.com/android-publisher/api-ref/rest
//https://cloud.google.com/nodejs/docs/reference/google-auth-library/latest

// TODO: Client should be setup once in the init. See nextjs instrumentation thing
// update - instrumentation worked locally, but didn't work on vercel. I left it as is so far
const setupClient = async () => {
  const jwtClient = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY!.split(String.raw`\n`).join("\n"),
    scopes: ["https://www.googleapis.com/auth/androidpublisher"],
  });

  // Connect to the Google Play Developer API with JWT Client
  const playApi = google.androidpublisher({
    version: "v3",
    auth: jwtClient,
  });

  return playApi;
};

/**
 * Acknowledge a subscription purchase with Play Developer API.
 * @param {params} PurchaseParams
 * @return {(Promise<boolean>)} whether the acknowledgement of the subscription purchase was successful
 */
export async function acknowledgeSubscriptionPurchase(
  params: PurchaseParams,
): Promise<boolean> {
  console.log("Acknowledging subscription", params.itemId);
  try {
    const playApi = await setupClient();
    const apiResponse = (
      await playApi.purchases.subscriptions.acknowledge({
        packageName: process.env.ANDROID_PACKAGE_ID,
        subscriptionId: params.itemId,
        token: params.purchaseToken,
      })
    )?.data;
    console.log("Acknowledge response");
    if (JSON.stringify(apiResponse) === `""`) {
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error acknowledging subscription", error);
    throw error;
  }
}

/**
 * Fetch full subscription purchase details from Play Developer API.
 * @param {params} PurchaseParams
 */
export async function fetchSubscriptionPurchase(
  params: PurchaseParams,
): Promise<billing.SubscriptionPurchase> {
  console.log("Fetching subscription", params.itemId);
  try {
    const playApi = await setupClient();
    const apiResponse = (
      await playApi.purchases.subscriptionsv2.get({
        packageName: process.env.ANDROID_PACKAGE_ID,
        token: params.purchaseToken,
      })
    )?.data;
    console.log("Fetch subscription response");

    console.log("Linked token", apiResponse.linkedPurchaseToken);

    return fromSubscriptionPurchaseV2(apiResponse, params.purchaseToken);
  } catch (error) {
    console.error("Error fetching subscription", error);
    throw error;
  }
}

/**
 * Cancel subscription using Play Developer API. It remains valid until its expiration period, but don't renew afterwards
 * @param {params} PurchaseParams
 */
export async function cancelSubscription(
  params: PurchaseParams,
): Promise<void> {
  console.log("Cancelling subscription", params.itemId);
  try {
    const playApi = await setupClient();

    await playApi.purchases.subscriptions.cancel({
      packageName: process.env.ANDROID_PACKAGE_ID,
      subscriptionId: params.itemId,
      token: params.purchaseToken,
    });
    console.log("Cancelled subscription");
  } catch (error) {
    console.error("Error cancelling subscription", error);
    throw error;
  }
}

/**
 * Immediately revoke and refund subscription using Play Developer API.
 * @param {params} PurchaseParams
 */
export async function revokeSubscription(
  params: PurchaseParams,
): Promise<void> {
  console.log("Revoking subscription", params.itemId);
  try {
    const playApi = await setupClient();

    await playApi.purchases.subscriptionsv2.revoke({
      packageName: process.env.ANDROID_PACKAGE_ID,
      token: params.purchaseToken,
      requestBody: { revocationContext: { fullRefund: {} } },
    });
    console.log("Revoked subscription");
  } catch (error) {
    console.error("Error revoking subscription", error);
    throw error;
  }
}

/**
 *Set the new expiry time for subscription using Play Developer API.
 * @param {params} PurchaseParams
 * @param {currentExpiryTimeMs} number
 * @param {newExpiryTimeMs} number
 */
export async function deferSubscription(
  params: PurchaseParams,
  currentExpiryTimeMs: number,
  newExpiryTimeMs: number,
): Promise<void> {
  console.log("Deferring subscription", params.itemId);
  try {
    const playApi = await setupClient();
    await playApi.purchases.subscriptions.defer({
      packageName: process.env.ANDROID_PACKAGE_ID,
      subscriptionId: params.itemId,
      token: params.purchaseToken,
      requestBody: {
        deferralInfo: {
          desiredExpiryTimeMillis: newExpiryTimeMs.toString(),
          expectedExpiryTimeMillis: currentExpiryTimeMs.toString(),
        },
      },
    });
    console.log("Deferred subscription");
  } catch (error) {
    console.error("Error deferring subscription", error);
    throw error;
  }
}

/**
 *  Acknowledge an in-app item purchase with Play Developer API.
 *
 * @param {params} PurchaseParams
 * @return {(Promise<boolean>)} whether the acknowledgement of the in-app purchase was successful
 */
// export async function acknowledgeInAppPurchase(
//   params: PurchaseParams
// ): Promise<boolean> {
//   try {
//     const playApi = await setupClient();
//     const apiResponse = (
//       await playApi.purchases.products.acknowledge({
//         packageName: process.env.ANDROID_PACKAGE_ID,
//         productId: params.itemId,
//         token: params.purchaseToken,
//       })
//     )?.data;
//     if (JSON.stringify(apiResponse) === `""`) {
//       return true;
//     }
//     return false;
//   } catch (error) {
//     console.error(`Error acknowledging in-app purchase : ${error}`);
//     throw error;
//   }
// }

/**
 *  Fetch a purchase from the Play Developer API and validate that it has not been consumed already.
 *
 * @param {params} PurchaseParams
 */
// export async function fetchPurchase(
//   params: PurchaseParams
// ): Promise<billing.Purchase | null> {
//   try {
//     const playApi = await setupClient();
//     const apiResponse = (
//       await playApi.purchases.products.get({
//         packageName: process.env.ANDROID_PACKAGE_ID,
//         productId: params.itemId,
//         token: params.purchaseToken,
//       })
//     )?.data;
//     console.log(
//       `PlayAPI Response : ${JSON.stringify(apiResponse, undefined, 2)}`
//     );
//     return billing.Purchase.fromApiResponse(
//       apiResponse,
//       params.purchaseToken,
//       params.itemId
//     );
//   } catch (error) {
//     console.error(`Error fetching purchase info : ${error}`);
//     throw error;
//   }
// }
