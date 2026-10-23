import { CancelReason, PaymentState, PurchaseType } from "./billing";
import { fromSubscriptionPurchaseV2 } from "./subscriptionPurchaseV2";

describe("fromSubscriptionPurchaseV2", () => {
  const active = {
    kind: "androidpublisher#subscriptionPurchaseV2",
    startTime: "2026-01-01T00:00:00Z",
    subscriptionState: "SUBSCRIPTION_STATE_ACTIVE",
    acknowledgementState: "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED",
    linkedPurchaseToken: "old-token",
    lineItems: [
      {
        productId: "composer",
        expiryTime: "2026-02-01T00:00:00Z",
        autoRenewingPlan: { autoRenewEnabled: true },
      },
    ],
  };

  it("maps an active subscription", () => {
    const result = fromSubscriptionPurchaseV2(active, "token");

    expect(result.purchaseToken).toBe("token");
    expect(result.startTimeMillis).toBe(Date.UTC(2026, 0, 1));
    expect(result.expiryTimeMillis).toBe(Date.UTC(2026, 1, 1));
    expect(result.autoRenewing).toBe(true);
    expect(result.paymentState).toBe(PaymentState.PAYMENT_RECEIVED);
    expect(result.cancelReason).toBe(CancelReason.NONE);
    expect(result.wasAcknowledged()).toBe(true);
    expect(result.linkedPurchaseToken).toBe("old-token");
    expect(result.purchaseType).toBe(PurchaseType.NORMAL);
  });

  it("treats grace period as a pending payment", () => {
    const result = fromSubscriptionPurchaseV2(
      {
        ...active,
        subscriptionState: "SUBSCRIPTION_STATE_IN_GRACE_PERIOD",
        lineItems: [
          { ...active.lineItems[0], expiryTime: "2999-01-01T00:00:00Z" },
        ],
      },
      "token",
    );

    expect(result.paymentState).toBe(PaymentState.PAYMENT_PENDING);
    expect(result.isGracePeriod()).toBe(true);
  });

  it("maps the cancel reason", () => {
    const cancel = (canceledStateContext: object) =>
      fromSubscriptionPurchaseV2({ ...active, canceledStateContext }, "token")
        .cancelReason;

    expect(cancel({ userInitiatedCancellation: {} })).toBe(CancelReason.USER);
    expect(cancel({ systemInitiatedCancellation: {} })).toBe(
      CancelReason.SYSTEM,
    );
    expect(cancel({ replacementCancellation: {} })).toBe(CancelReason.REPLACED);
    expect(cancel({ developerInitiatedCancellation: {} })).toBe(
      CancelReason.DEVELOPER,
    );
  });

  it("uses the latest expiry, free trial and test flags", () => {
    const result = fromSubscriptionPurchaseV2(
      {
        ...active,
        acknowledgementState: "ACKNOWLEDGEMENT_STATE_PENDING",
        testPurchase: {},
        lineItems: [
          { expiryTime: "2026-01-15T00:00:00Z" },
          { expiryTime: "2026-03-01T00:00:00Z", offerPhase: { freeTrial: {} } },
        ],
      },
      "token",
    );

    expect(result.expiryTimeMillis).toBe(Date.UTC(2026, 2, 1));
    expect(result.paymentState).toBe(PaymentState.FREE_TRIAL);
    expect(result.purchaseType).toBe(PurchaseType.TEST);
    expect(result.wasAcknowledged()).toBe(false);
    expect(result.autoRenewing).toBe(false);
  });
});
