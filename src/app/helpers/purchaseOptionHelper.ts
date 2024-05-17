import { CancelReason } from "@/lib/billing";
import { TierKey } from "@/lib/tier";
import { PurchaseOption } from "../components/auth/GooglePlayPurchaseSection";

export const getTitle = (purchaseOption: DigitalGoodsProductDetails) =>
  purchaseOption.title.substring(0, purchaseOption.title.indexOf(" ("));

export const getBillingPeriod = (
  purchaseOption: DigitalGoodsProductDetails
) => {
  switch (purchaseOption.subscriptionPeriod) {
    case "P1W":
      return "weekly";
    case "P1M":
      return "monthly";
    case "P3M":
      return "quarterly";
    case "P6M":
      return "half-yearly";
    case "P1Y":
      return "yearly";
    default:
      return purchaseOption.subscriptionPeriod;
  }
};

export const isPurchaseCancelled = (purchaseOption: PurchaseOption) => {
  const cancellationReason = purchaseOption?.purchaseData?.cancellationReason;

  return cancellationReason !== undefined
    ? cancellationReason !== CancelReason.NONE
    : false;
};

export type ChangeAction = "Upgrade" | "Downgrade";

export const getChangeAction = (
  existingNotCancelledPurchaseOption?: PurchaseOption
) =>
  !existingNotCancelledPurchaseOption
    ? undefined
    : (existingNotCancelledPurchaseOption.itemId as TierKey) ===
      "guitar_upscale.composer"
    ? "Downgrade"
    : "Upgrade";
