import { useDigitalGoodsServiceInfo } from "@/app/context/DigitalGoodsServiceInfoProvider";
import { Theme } from "@/app/data/theme";
import {
  GetSubscriptionActionParams,
  getMakePurchase,
} from "@/app/helpers/getMakePurchase";
import {
  getBillingPeriod,
  getChangeAction,
  getExistingNonCancelledPurchase,
  isPurchaseCancelled,
} from "@/app/helpers/purchaseOptionHelper";
import { selectUi } from "@/app/store/uiSlice";
import { CancellationMode } from "@/lib/apiTypes";
import { msToFormattedDate } from "@/lib/dateHelper";
import { Button } from "@mui/material";
import { FC } from "react";
import { useDispatch, useSelector } from "react-redux";

interface GooglePlayPurchaseOptionButtonProps
  extends GetSubscriptionActionParams {
  onClick: () => void;
  isSelected: boolean;
  showCancellationDialog: () => void;
  showChangeSubscriptionDialog: () => void;
}

export const GooglePlayPurchaseOptionButton: FC<
  GooglePlayPurchaseOptionButtonProps
> = (params) => {
  const {
    purchaseOption,
    onClick,
    isSelected,
    showCancellationDialog,
    showChangeSubscriptionDialog,
    disabledMessage,
    allPurchasedOptions,
  } = params;

  const existingNonCancelledPurchaseOption = getExistingNonCancelledPurchase(
    allPurchasedOptions,
    purchaseOption
  );
  const hasDigitalGoodsService = useDigitalGoodsServiceInfo();
  const dispatch = useDispatch();
  const makePurchase = existingNonCancelledPurchaseOption
    ? () => showChangeSubscriptionDialog()
    : getMakePurchase(params, hasDigitalGoodsService, dispatch);

  const title = purchaseOption.tier;
  const { theme } = useSelector(selectUi);
  const isAlreadyPurchased =
    purchaseOption.purchaseData?.purchaseToken !== undefined;
  const isCancelled = isPurchaseCancelled(purchaseOption);
  const isPurchasedAndNotCancelled = isAlreadyPurchased && !isCancelled;
  const changeAction = getChangeAction(existingNonCancelledPurchaseOption);

  let buttonColor: "error" | "primary";
  let buttonAction: () => void | Promise<void>;
  let purchaseStatusLine1: string | undefined;
  let purchaseStatusLine2: string | undefined;
  let buttonContent: string;
  let buttonTitle: string;
  let buttonDisabled: boolean;
  let bg: string;

  if (isPurchasedAndNotCancelled) {
    const expirationDate = msToFormattedDate(
      purchaseOption.purchaseData?.expirationDateMs
    );
    const subscribedDate = msToFormattedDate(
      purchaseOption.purchaseData?.subscribedDateMs
    );
    buttonColor = "error";
    buttonAction = async () => await showCancellationDialog();
    purchaseStatusLine1 =
      "Owned" +
      (subscribedDate !== undefined ? " since " + subscribedDate : "");
    purchaseStatusLine2 =
      expirationDate !== undefined ? "Expires " + expirationDate : "";
    buttonContent =
      purchaseOption.purchaseData?.cancellationMode === CancellationMode.Cancel
        ? "Cancel"
        : "Revoke";
    buttonTitle = disabledMessage ?? buttonContent;
    buttonDisabled = disabledMessage !== undefined ? true : false;
    bg = theme === Theme.Light ? "bg-accent-light" : "bg-accent-dark";
  } else if (isCancelled) {
    const expirationDate = msToFormattedDate(
      purchaseOption.purchaseData?.expirationDateMs
    );
    buttonColor = "primary";
    buttonAction = makePurchase; // re-subscribe
    purchaseStatusLine1 = "Cancelled";
    purchaseStatusLine2 = "Owned till " + (expirationDate ?? "expiry");
    buttonContent =
      "Re-subscribe" +
      (changeAction ? " and " + changeAction.toLocaleLowerCase() : "");
    buttonTitle = disabledMessage ?? buttonContent;
    buttonDisabled = disabledMessage !== undefined ? true : false;
    bg = isSelected
      ? theme === Theme.Light
        ? "bg-primary-light"
        : "bg-primary-dark"
      : theme === Theme.Light
      ? "bg-disabled-light"
      : "bg-disabled-dark";
  } else {
    // not purchased
    buttonColor = "primary";
    buttonAction = makePurchase; // re-subscribe
    buttonContent = changeAction ?? "Subscribe";
    buttonTitle = disabledMessage ?? buttonContent;
    buttonDisabled = disabledMessage !== undefined ? true : false;
    bg = isSelected
      ? theme === Theme.Light
        ? "bg-primary-light"
        : "bg-primary-dark"
      : theme === Theme.Light
      ? "bg-secondary-light"
      : "bg-secondary-dark";
  }

  // Format the price according to the user locale.
  const localizedPrice = new Intl.NumberFormat(navigator.language, {
    style: "currency",
    currency: purchaseOption.details.price.currency,
  }).format(parseFloat(purchaseOption.details.price.value));

  const handleClick = () => onClick();

  const className =
    "p-2 flex flex-col gap-1 justify-center cursor-pointer " + bg;

  return (
    <>
      <p onClick={handleClick} className={`${className}`}>
        <div className="text-lg font-semibold">{title}</div>
        {purchaseStatusLine1 !== undefined && (
          <div className="text-xs whitespace-nowrap">{purchaseStatusLine1}</div>
        )}
        {purchaseStatusLine2 !== undefined && (
          <div className="text-xs whitespace-nowrap">{purchaseStatusLine2}</div>
        )}
      </p>
      <p onClick={handleClick} className={`${className} text-sm`}>
        {purchaseOption.details.description}
      </p>
      <p onClick={handleClick} className={`${className} text-sm`}>
        {localizedPrice}
      </p>
      <p
        onClick={handleClick}
        className={`${className} text-sm whitespace-nowrap`}
      >
        {"Renews " + getBillingPeriod(purchaseOption.details)}
      </p>
      <p className={className}>
        <Button
          className="w-full whitespace-nowrap"
          size="small"
          variant="contained"
          disabled={buttonDisabled}
          color={buttonColor}
          title={buttonTitle}
          onClick={buttonAction}
        >
          {buttonContent}
        </Button>
      </p>
    </>
  );
};
