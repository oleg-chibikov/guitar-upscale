import { ApiCallResult, acknowledgePurchaseOnBackend } from "@/app/apiClient";
import { useDigitalGoodsService } from "@/app/context/DIgitalGoodsServiceProvider";
import { AlertType } from "@/app/data/alertType";
import { Theme } from "@/app/data/theme";
import { incrementAndReload } from "@/app/helpers/reloadHelper";
import { buildDigitalGoodsService } from "@/app/helpers/serviceHelper";
import { GOOGLE_PLAY_RELOAD_KEY } from "@/app/hooks/useGooglePlayAuth";
import { selectUi, setAndShowAlert } from "@/app/store/uiSlice";
import { TierKey } from "@/lib/tiers";
import { Button } from "@mui/material";
import { FC } from "react";
import { useDispatch, useSelector } from "react-redux";

interface GooglePlaySubscriptionOptionButtonProps {
  subscriptionOption: DigitalGoodsProductDetails;
  onClick: (option: DigitalGoodsProductDetails) => void;
  isSelected: boolean;
  setIsLoading: (isLoading: boolean) => void;
  isAlreadyPurchased: boolean;
  showCancellationModal: (option: DigitalGoodsProductDetails) => void;
}

export const GooglePlaySubscriptionOptionButton: FC<
  GooglePlaySubscriptionOptionButtonProps
> = ({
  subscriptionOption,
  onClick,
  isSelected,
  setIsLoading,
  isAlreadyPurchased,
  showCancellationModal,
}) => {
  const title = subscriptionOption.title.substring(
    0,
    subscriptionOption.title.indexOf(" (")
  );
  const hasDigitalGoodsService = useDigitalGoodsService();
  const dispatch = useDispatch();
  const { theme } = useSelector(selectUi);

  const makePurchase = async () => {
    if (!hasDigitalGoodsService) {
      return;
    }
    // Define the preferred payment method and item ID
    const paymentMethods: PaymentMethodData[] = [
      {
        supportedMethods: "https://play.google.com/billing",
        data: {
          sku: subscriptionOption.itemId,
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
        itemId: subscriptionOption.itemId as TierKey,
        purchaseToken,
      });

      if (result === ApiCallResult.Success) {
        const digitalGoodsService = await buildDigitalGoodsService();
        // Optional: consume the purchase, allowing the user to purchase
        // the same item again.
        digitalGoodsService.consume(purchaseToken);

        // Optional: tell the PaymentRequest API the validation was
        // successful. The user-agent may show a "payment successful"
        // message to the user.
        await paymentResponse.complete("success");
        const message = `Payment successful! Your subscription level is "${title}"`;
        dispatch(
          setAndShowAlert({
            message,
          })
        );
        await incrementAndReload(GOOGLE_PLAY_RELOAD_KEY, 0, dispatch, message);
      } else if (result === ApiCallResult.SkipProcessing) {
        dispatch(
          setAndShowAlert({
            message: `Subscription "${title}" is cancelled. Cannot acknowledge`,
            alertType: AlertType.Warning,
          })
        );
      } else {
        await paymentResponse.complete("fail");
        dispatch(
          setAndShowAlert({
            message:
              "Cannot acknowledge the purchase. It will be auto refunded in 3 days by Google unless acknowlege succeeds (it can happen when you launch the app)",
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
          message: "Subscribing aborted",
          alertType: AlertType.Warning,
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Format the price according to the user locale.
  const localizedPrice = new Intl.NumberFormat(navigator.language, {
    style: "currency",
    currency: subscriptionOption.price.currency,
  }).format(parseFloat(subscriptionOption.price.value));

  return (
    <div
      onClick={() => !isAlreadyPurchased && onClick(subscriptionOption)}
      className={`flex justify-between align-middle items-center flex-row p-2 gap-2 ${
        isAlreadyPurchased
          ? "bg-emerald-600" // TODO: themed colors?
          : !isSelected
          ? theme === Theme.Light
            ? "bg-accent-light"
            : "bg-accent-dark"
          : theme === Theme.Light
          ? "bg-accent_stronger-light"
          : "bg-accent_stronger-dark"
      }`}
    >
      <p className="text-lg font-semibold">{title}</p>
      <p className="text-sm grow">{subscriptionOption.description}</p>
      <p className="text-sm">{localizedPrice}</p>
      <p className="text-sm grow">{subscriptionOption.subscriptionPeriod}</p>
      <Button
        size="small"
        variant="contained"
        color={isAlreadyPurchased ? "error" : "primary"}
        onClick={async () => {
          if (isAlreadyPurchased) {
            showCancellationModal(subscriptionOption);
          } else {
            await makePurchase();
          }
        }}
      >
        {/* TODO: Cancel in a separate modal with confirmation */}
        {/* TODO: upgrade/downgrade instead of subscribe if there is another active not cancelled subscription */}
        {isAlreadyPurchased ? "Cancel subscription" : "Subscribe"}
      </Button>
    </div>
  );
};
