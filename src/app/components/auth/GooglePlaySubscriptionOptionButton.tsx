import { acknowldegeSubscriptionOnBackend } from "@/app/apiClient";
import { useDigitalGoodsService } from "@/app/context/DIgitalGoodsServiceProvider";
import { setAndShowAlert } from "@/app/store/uiSlice";
import { Button } from "@mui/material";
import { FC } from "react";
import { useDispatch } from "react-redux";

interface GooglePlaySubscriptionOptionButtonProps {
  subscriptionOption: DigitalGoodsProductDetails;
}

export const GooglePlaySubscriptionOptionButton: FC<
  GooglePlaySubscriptionOptionButtonProps
> = ({ subscriptionOption }) => {
  const digitalGoodsService = useDigitalGoodsService();
  const dispatch = useDispatch();

  async function makePurchase(itemId: string) {
    if (!digitalGoodsService) {
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
        dispatch(setAndShowAlert({ message: data.error, isError: true }));
        return;
      } else {
        // Optional: consume the purchase, allowing the user to purchase
        // the same item again.
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
      dispatch(setAndShowAlert({ message: "Aborted " + e, isError: true }));
    }
  }

  // Format the price according to the user locale.
  const localizedPrice = new Intl.NumberFormat(navigator.language, {
    style: "currency",
    currency: subscriptionOption.price.currency,
  }).format(parseFloat(subscriptionOption.price.value));

  // TODO: UI
  return (
    <div>
      {[
        subscriptionOption.itemId,
        subscriptionOption.title,
        JSON.stringify(subscriptionOption.price, undefined, 2),
        localizedPrice,
        subscriptionOption.description,
      ].join("; ")}
      <Button onClick={() => makePurchase(subscriptionOption.itemId)} />
    </div>
  );
};
