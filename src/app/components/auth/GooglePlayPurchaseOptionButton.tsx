import { useDigitalGoodsService } from "@/app/context/DigitalGoodsServiceProvider";
import { Theme } from "@/app/data/theme";
import {
  GetMakePurchaseParams,
  getMakePurchase,
} from "@/app/helpers/getMakePurchase";
import {
  getBillingPeriod,
  getChangeAction,
  getTitle,
  isPurchaseCancelled,
} from "@/app/helpers/purchaseOptionHelper";
import { selectUi } from "@/app/store/uiSlice";
import { CancellationMode } from "@/lib/apiTypes";
import { msToFormattedDate } from "@/lib/dateHelper";
import { Button } from "@mui/material";
import { FC } from "react";
import { useDispatch, useSelector } from "react-redux";
import { PurchaseOption } from "./GooglePlayPurchaseSection";

interface GooglePlayPurchaseOptionButtonProps extends GetMakePurchaseParams {
  onClick: (option: PurchaseOption) => void;
  isSelected: boolean;
  showCancellationModal: (option: PurchaseOption) => void;
  showChangeSubscriptionModal: (
    option: PurchaseOption,
    existingOption: PurchaseOption
  ) => void;
}

export const GooglePlayPurchaseOptionButton: FC<
  GooglePlayPurchaseOptionButtonProps
> = (params) => {
  const {
    purchaseOption,
    onClick,
    isSelected,
    showCancellationModal,
    showChangeSubscriptionModal,
    disabledMessage,
    existingNotCancelledPurchaseOption,
  } = params;

  const hasDigitalGoodsService = useDigitalGoodsService();
  const dispatch = useDispatch();
  const makePurchase = existingNotCancelledPurchaseOption
    ? () =>
        showChangeSubscriptionModal(
          purchaseOption,
          existingNotCancelledPurchaseOption
        )
    : getMakePurchase(params, hasDigitalGoodsService, dispatch);

  const title = getTitle(purchaseOption);
  const { theme } = useSelector(selectUi);
  const isAlreadyPurchased = purchaseOption.purchaseToken !== undefined;
  const isCancelled = isPurchaseCancelled(purchaseOption);
  const isPurchasedAndNotCancelled = isAlreadyPurchased && !isCancelled;
  const changeAction = getChangeAction(existingNotCancelledPurchaseOption);

  let buttonColor: "error" | "primary";
  let buttonAction: () => void | Promise<void>;
  let purchaseStatus: string | undefined;
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
    buttonAction = async () => await showCancellationModal(purchaseOption);
    purchaseStatus = `Owned${subscribedDate ? " since " + subscribedDate : ""}${
      expirationDate ? ". Expires: " + expirationDate : ""
    }`;
    buttonContent =
      purchaseOption.purchaseData?.cancellationMode == CancellationMode.Cancel
        ? "Cancel"
        : "Revoke";
    buttonTitle = disabledMessage ?? buttonContent;
    buttonDisabled = disabledMessage ? true : false;
    bg = theme === Theme.Light ? "bg-accent-light" : "bg-accent-dark";
  } else if (isCancelled) {
    const expirationDate = msToFormattedDate(
      purchaseOption.purchaseData?.expirationDateMs
    );
    buttonColor = "primary";
    buttonAction = makePurchase; // re-subscribe
    purchaseStatus = "Cancelled, owned till " + (expirationDate ?? "expiry");
    buttonContent =
      "Re-subscribe" +
      (changeAction ? " and " + changeAction.toLocaleLowerCase() : "");
    buttonTitle = disabledMessage ?? buttonContent;
    buttonDisabled = disabledMessage ? true : false;
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
    purchaseStatus = "";
    buttonContent = changeAction ?? "Subscribe";
    buttonTitle = disabledMessage ?? buttonContent;
    buttonDisabled = disabledMessage ? true : false;
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
    currency: purchaseOption.price.currency,
  }).format(parseFloat(purchaseOption.price.value));

  const handleClick = () => !isAlreadyPurchased && onClick(purchaseOption);

  const className =
    "p-2 flex flex-col gap-1 justify-center cursor-pointer " + bg;

  return (
    <>
      <p onClick={handleClick} className={`${className} text-lg font-semibold`}>
        <div>{title}</div>
        {purchaseStatus && <div className="text-xs">{purchaseStatus}</div>}
      </p>
      <p onClick={handleClick} className={`${className} text-sm`}>
        {purchaseOption.description}
      </p>
      <p onClick={handleClick} className={`${className} text-sm`}>
        {localizedPrice}
      </p>
      <p
        onClick={handleClick}
        className={`${className} text-sm whitespace-nowrap`}
      >
        {"Renews " + getBillingPeriod(purchaseOption)}
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
          {/* TODO: upgrade/downgrade instead of subscribe if there is another active not cancelled subscription */}
          {buttonContent}
        </Button>
      </p>
    </>
  );
};
