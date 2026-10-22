import type { androidpublisher_v3 } from "googleapis";
import {
  CancelReason,
  PaymentState,
  PurchaseType,
  SubscriptionPurchase,
} from "./billing";

type SubscriptionPurchaseV2 = androidpublisher_v3.Schema$SubscriptionPurchaseV2;

const toMillis = (time?: string | null) =>
  time ? new Date(time).getTime() : 0;

const getCancelReason = (purchase: SubscriptionPurchaseV2) => {
  const context = purchase.canceledStateContext;
  if (!context) return CancelReason.NONE;
  if (context.userInitiatedCancellation) return CancelReason.USER;
  if (context.replacementCancellation) return CancelReason.REPLACED;
  if (context.developerInitiatedCancellation) return CancelReason.DEVELOPER;
  return CancelReason.SYSTEM;
};

const getPaymentState = (
  purchase: SubscriptionPurchaseV2,
  isFreeTrial: boolean
) => {
  switch (purchase.subscriptionState) {
    case "SUBSCRIPTION_STATE_PENDING":
    case "SUBSCRIPTION_STATE_IN_GRACE_PERIOD":
    case "SUBSCRIPTION_STATE_ON_HOLD":
      return PaymentState.PAYMENT_PENDING;
    default:
      return isFreeTrial ? PaymentState.FREE_TRIAL : PaymentState.PAYMENT_RECEIVED;
  }
};

// Google removed purchases.subscriptions.get, so the v2 response is mapped to the v1 fields the app reads.
export const fromSubscriptionPurchaseV2 = (
  purchase: SubscriptionPurchaseV2,
  purchaseToken: string
): SubscriptionPurchase => {
  const lineItem = [...(purchase.lineItems ?? [])].sort(
    (a, b) => toMillis(b.expiryTime) - toMillis(a.expiryTime)
  )[0];

  return SubscriptionPurchase.fromApiResponse(
    {
      kind: purchase.kind ?? "",
      startTimeMillis: toMillis(purchase.startTime),
      expiryTimeMillis: toMillis(lineItem?.expiryTime),
      autoRenewing: lineItem?.autoRenewingPlan?.autoRenewEnabled === true,
      paymentState: getPaymentState(
        purchase,
        lineItem?.offerPhase?.freeTrial !== undefined
      ),
      cancelReason: getCancelReason(purchase),
      acknowledgementState:
        purchase.acknowledgementState === "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED",
      linkedPurchaseToken: purchase.linkedPurchaseToken ?? "",
      orderId: lineItem?.latestSuccessfulOrderId ?? "",
      productId: lineItem?.productId ?? "",
      countryCode: purchase.regionCode ?? "",
      purchaseType: purchase.testPurchase
        ? PurchaseType.TEST
        : PurchaseType.NORMAL,
    },
    purchaseToken
  );
};
