import { CancelReason } from "@/lib/billing";
import {
  PurchaseOption,
  PurchasedOption,
} from "../components/auth/GooglePlayPurchaseSection";
import { GuitarUpscaleSpecificDigitalGoodsProductDetails } from "../digitalGoodsBrowser";

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

export const getChangeAction = (
  existingNotCancelledPurchaseOption?: PurchasedOption
) =>
  !existingNotCancelledPurchaseOption
    ? undefined
    : existingNotCancelledPurchaseOption.tier === "Composer"
    ? "Downgrade"
    : "Upgrade";

// Another non cancelled option different from purchaseOption
// If it exists - we should change the existing subscription instead of subscribing to the new one
// There should be only once such option
export const getExistingNonCancelledPurchase = (
  allPurchasedOptions: PurchasedOption[],
  purchaseOption: PurchaseOption // search for something other than this
) =>
  allPurchasedOptions.find(
    (x) => !x.isCancelled && x.tier !== purchaseOption.tier
  );

// Another cancelled option different from purchaseOption
// If it exists we should take its tier into account when granting permissions (on backend)
export const getExistingCancelledPurchase = (
  allPurchasedOptions: PurchasedOption[],
  purchaseOption: PurchaseOption // search for something other than this
) =>
  allPurchasedOptions.find(
    (x) => x.isCancelled && x.tier !== purchaseOption.tier
  );
