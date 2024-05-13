import { acknowldegeSubscriptionOnBackend } from "@/app/apiClient";
import { useDigitalGoodsService } from "@/app/context/DIgitalGoodsServiceProvider";
import { AlertType } from "@/app/data/alertType";
import { Theme } from "@/app/data/theme";
import { selectUi, setAndShowAlert } from "@/app/store/uiSlice";
import { Button } from "@mui/material";
import { FC } from "react";
import { useDispatch, useSelector } from "react-redux";

interface GooglePlaySubscriptionOptionButtonProps {
  subscriptionOption: DigitalGoodsProductDetails;
  onClick: (option: DigitalGoodsProductDetails) => void;
  isSelected: boolean;
}

export const GooglePlaySubscriptionOptionButton: FC<
  GooglePlaySubscriptionOptionButtonProps
> = ({ subscriptionOption, onClick, isSelected }) => {
  const hasDigitalGoodsService = useDigitalGoodsService();
  const dispatch = useDispatch();
  const { theme } = useSelector(selectUi);

  async function makePurchase(itemId: string) {
    if (!hasDigitalGoodsService) {
      return;
    }
    // Define the preferred payment method and item ID
    const paymentMethods: PaymentMethodData[] = [
      {
        supportedMethods: "https://play.google.com/billing",
        data: {
          sku: itemId,
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
    try {
      const paymentResponse = await request.show();
      const { purchaseToken } = paymentResponse.details;

      const data = await acknowldegeSubscriptionOnBackend({
        itemId,
        purchaseToken,
      });
      if (data.error) {
        await paymentResponse.complete("fail");
        dispatch(
          setAndShowAlert({ message: data.error, alertType: AlertType.Error })
        );
        return;
      } else {
        // Optional: consume the purchase, allowing the user to purchase
        // the same item again.
        const getDigitalGoodsService = window.getDigitalGoodsService;
        const digitalGoodsService = await getDigitalGoodsService(
          "https://play.google.com/billing"
        );
        digitalGoodsService.consume(purchaseToken);

        // Optional: tell the PaymentRequest API the validation was
        // successful. The user-agent may show a "payment successful"
        // message to the user.
        await paymentResponse.complete("success");
        dispatch(
          setAndShowAlert({
            message: "Payment successful! Subscribed to " + itemId,
          })
        );
      }
    } catch (e) {
      // The purchase failed, and we can handle the failure here.
      // AbortError usually means a user cancellation

      console.log(e);
      dispatch(
        setAndShowAlert({
          message: "Subscribe cancelled",
          alertType: AlertType.Warning,
        })
      );
    }
  }

  // Format the price according to the user locale.
  const localizedPrice = new Intl.NumberFormat(navigator.language, {
    style: "currency",
    currency: subscriptionOption.price.currency,
  }).format(parseFloat(subscriptionOption.price.value));

  // TODO: UI
  return (
    <div
      onClick={() => onClick(subscriptionOption)}
      className={`flex justify-between align-middle items-center flex-row p-2 gap-2 ${
        !isSelected
          ? theme === Theme.Light
            ? "bg-accent-light"
            : "bg-accent-dark"
          : theme === Theme.Light
          ? "bg-accent_stronger-light"
          : "bg-accent_stronger-dark"
      }`}
    >
      <p className="text-lg font-semibold">
        {subscriptionOption.title.substring(
          0,
          subscriptionOption.title.indexOf(" (")
        )}
      </p>
      <p className="text-sm grow">{subscriptionOption.description}</p>
      <p className="text-sm">{localizedPrice}</p>
      <Button
        size="small"
        variant="contained"
        color="primary"
        onClick={() => makePurchase(subscriptionOption.itemId)}
      >
        Purchase
      </Button>
    </div>
  );
};
