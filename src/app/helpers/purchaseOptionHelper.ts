import { PurchaseOption } from "@/app/components/auth/GooglePlayPurchaseSection";
import { GuitarUpscaleSpecificDigitalGoodsProductDetails } from "@/app/digitalGoodsBrowser";
import { CancelReason } from "@/lib/billing";

export const getTitle = (purchaseOption: DigitalGoodsProductDetails) =>
  purchaseOption.title.substring(0, purchaseOption.title.indexOf(" ("));

export const getBillingPeriod = (
  purchaseOption: GuitarUpscaleSpecificDigitalGoodsProductDetails
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
    : existingNotCancelledPurchaseOption.itemId === "guitar_upscale.composer"
    ? "Downgrade"
    : "Upgrade";
