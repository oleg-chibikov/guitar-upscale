import { ApiCallResult, acknowledgePurchaseOnBackend } from "@/app/apiClient";
import { useDigitalGoodsService } from "@/app/context/DIgitalGoodsServiceProvider";
import { AlertType } from "@/app/data/alertType";
import { Theme } from "@/app/data/theme";
import { msToFormattedDate } from "@/app/helpers/dateHelper";
import {
  getBillingPeriod,
  getTitle,
  isPurchaseCancelled,
} from "@/app/helpers/purchaseOptionHelper";
import { incrementAndReload } from "@/app/helpers/reloadHelper";
import { buildDigitalGoodsService } from "@/app/helpers/serviceHelper";
import { GOOGLE_PLAY_RELOAD_KEY } from "@/app/hooks/useGooglePlayAuth";
import { selectUi, setAndShowAlert } from "@/app/store/uiSlice";
import { CancellationMode } from "@/lib/apiTypes";
import { TierKey } from "@/lib/tier";
import { Button } from "@mui/material";
import { FC } from "react";
import { useDispatch, useSelector } from "react-redux";
import { PurchaseInfo } from "./GooglePlayPurchaseSection";

interface GooglePlayPurchaseOptionButtonProps {
  purchaseOption: PurchaseInfo;
  onClick: (option: PurchaseInfo) => void;
  isSelected: boolean;
  setIsLoading: (isLoading: boolean) => void;
  showCancellationModal: (option: PurchaseInfo) => void;
  disabledMessage?: string;
}

export const GooglePlayPurchaseOptionButton: FC<
  GooglePlayPurchaseOptionButtonProps
> = ({
  purchaseOption,
  onClick,
  isSelected,
  setIsLoading,
  showCancellationModal,
  disabledMessage,
}) => {
  const title = getTitle(purchaseOption);
  const hasDigitalGoodsService = useDigitalGoodsService();
  const dispatch = useDispatch();
  const { theme } = useSelector(selectUi);
  const isAlreadyPurchased = purchaseOption.purchaseToken !== undefined;
  const isCancelled = isPurchaseCancelled(purchaseOption);
  const isPurchasedAndNotCancelled = isAlreadyPurchased && !isPurchaseCancelled;

  const makePurchase = async () => {
    if (!hasDigitalGoodsService) {
      return;
    }
    if (disabledMessage !== undefined) {
      console.log(disabledMessage);
      return;
    }
    // Define the preferred payment method and item ID
    const paymentMethods: PaymentMethodData[] = [
      {
        supportedMethods: "https://play.google.com/billing",
        data: {
          sku: purchaseOption.itemId,
        },
      },
    ];

    // The "total" member of the paymentDetails is required by the Payment
    // Request API, but is not used when using Google Play Billing. We can
    // set it up with bogus details.
    const paymentDetails = {
      total: {
        label: `Dummy`,
        amount: { currency: `USD`, value: `0` },
      },
    };

    const request = new PaymentRequest(paymentMethods, paymentDetails);
    setIsLoading(true);
    try {
      const paymentResponse = await request.show();
      const { purchaseToken } = paymentResponse.details;

      const result = await acknowledgePurchaseOnBackend({
        itemId: purchaseOption.itemId as TierKey,
        purchaseToken,
      });

      if (result.status === ApiCallResult.Success) {
        const digitalGoodsService = await buildDigitalGoodsService();
        // Optional: consume the purchase, allowing the user to purchase
        // the same item again.
        digitalGoodsService.consume(purchaseToken);

        // Optional: tell the PaymentRequest API the validation was
        // successful. The user-agent may show a "payment successful"
        // message to the user.
        await paymentResponse.complete("success");
        const message = `Payment successful! Your level is "${title}"`;
        dispatch(
          setAndShowAlert({
            message,
          })
        );
        await incrementAndReload(GOOGLE_PLAY_RELOAD_KEY, 0, dispatch, message);
      } else if (result.status === ApiCallResult.SkipProcessing) {
        dispatch(
          setAndShowAlert({
            message: `"${title}" is cancelled. Cannot acknowledge`,
            alertType: AlertType.Warning,
          })
        );
      } else {
        await paymentResponse.complete("fail");
        dispatch(
          setAndShowAlert({
            message: `Cannot acknowledge the purchase for "${title}". It will be auto refunded in 3 days by Google unless acknowlege succeeds (it can happen when you launch the app)`,
            alertType: AlertType.Error,
          })
        );
        return;
      }
    } catch (e) {
      // The purchase failed, and we can handle the failure here.
      // AbortError usually means a user cancellation

      console.log(e);
      dispatch(
        setAndShowAlert({
          message: "Purchasing aborted",
          alertType: AlertType.Warning,
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  let buttonColor: "error" | "primary";
  let buttonAction: () => Promise<void>;
  let purchaseStatus: string | undefined;
  let buttonContent: string;
  let buttonTitle: string;
  let buttonDisabled: boolean;

  if (isPurchasedAndNotCancelled) {
    buttonColor = "error";
    buttonAction = async () => await showCancellationModal(purchaseOption);
    purchaseStatus = "Owned";
    buttonContent =
      purchaseOption.purchaseData?.cancellationMode == CancellationMode.Cancel
        ? "Cancel further payments"
        : "Revoke and refund subscription";
    buttonTitle = disabledMessage ?? buttonContent;
    buttonDisabled = disabledMessage ? true : false;
  } else if (isCancelled) {
    buttonColor = "primary";
    buttonAction = makePurchase; // re-subscribe
    const expirationDate = msToFormattedDate(
      purchaseOption.purchaseData?.expirationDateMs
    );
    purchaseStatus = "Cancelled, owned till " + (expirationDate ?? "expiry");
    buttonContent = "Re-subscribe";
    buttonTitle = disabledMessage ?? buttonContent;
    buttonDisabled = disabledMessage ? true : false;
  } else {
    // not purchased
    buttonColor = "primary";
    buttonAction = makePurchase; // re-subscribe
    purchaseStatus = "";
    buttonContent = "Subscribe";
    buttonTitle = disabledMessage ?? buttonContent;
    buttonDisabled = disabledMessage ? true : false;
  }

  // Format the price according to the user locale.
  const localizedPrice = new Intl.NumberFormat(navigator.language, {
    style: "currency",
    currency: purchaseOption.price.currency,
  }).format(parseFloat(purchaseOption.price.value));

  const handleClick = () => !isAlreadyPurchased && onClick(purchaseOption);

  const className =
    "p-2 flex flex-col gap-1 justify-center cursor-pointer " +
    (isCancelled
      ? theme === Theme.Light
        ? "bg-disabled-light"
        : "bg-disabled-dark"
      : isAlreadyPurchased
      ? theme === Theme.Light
        ? "bg-accent-light"
        : "bg-accent-dark"
      : !isSelected
      ? theme === Theme.Light
        ? "bg-secondary-light"
        : "bg-secondary-dark"
      : theme === Theme.Light
      ? "bg-primary-light"
      : "bg-primary-dark");

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
