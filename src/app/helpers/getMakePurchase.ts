import { UnknownAction } from "@reduxjs/toolkit";
import { Dispatch } from "react";
import {
  acknowledgePurchaseOnBackend,
  ApiCallResult,
  changePurchaseOnBackend,
} from "../apiClient";
import { PurchaseOption } from "../components/auth/GooglePlayPurchaseSection";
import { AlertType } from "../data/alertType";
import { GOOGLE_PLAY_RELOAD_KEY } from "../hooks/useGooglePlayAuth";
import { setAndShowAlert } from "../store/uiSlice";
import { getTitle } from "./purchaseOptionHelper";
import { incrementAndReload } from "./reloadHelper";
import { buildDigitalGoodsService } from "./serviceHelper";

export interface GetMakePurchaseParams {
  purchaseOption: PurchaseOption;
  setIsLoading: (isLoading: boolean) => void;
  disabledMessage?: string;
  existingNotCancelledPurchaseOption?: PurchaseOption; // another option different from purchaseOption. If it exists - we should change the existing subscription instead of subscribing to the new one
}

export const getMakePurchase = (
  {
    purchaseOption,
    setIsLoading,
    disabledMessage,
    existingNotCancelledPurchaseOption,
  }: GetMakePurchaseParams,
  hasDigitalGoodsService: boolean,
  dispatch: Dispatch<UnknownAction>
) => {
  const showGooglePlayPurchaseUiAndSubscribe = async () => {
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
    let paymentResponse: PaymentResponse;
    let purchaseToken: string;
    try {
      paymentResponse = await request.show();
      purchaseToken = paymentResponse.details.purchaseToken;
      return { completeResponse: paymentResponse.complete, purchaseToken };
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
      return null;
    }
  };

  const makePurchase = async () => {
    if (!hasDigitalGoodsService) {
      return;
    }

    if (disabledMessage !== undefined) {
      console.log(disabledMessage);
      return;
    }

    const title = getTitle(purchaseOption);

    setIsLoading(true);
    try {
      const purchaseResult = await showGooglePlayPurchaseUiAndSubscribe();
      if (!purchaseResult) {
        return;
      }
      const { completeResponse, purchaseToken } = purchaseResult;
      const purchaseFunction = existingNotCancelledPurchaseOption?.purchaseToken // this should always be true, just to satisfy the compiler
        ? changePurchaseOnBackend(
            {
              itemId: purchaseOption.itemId,
              purchaseToken,
            },
            {
              itemId: existingNotCancelledPurchaseOption.itemId,
              purchaseToken: existingNotCancelledPurchaseOption.purchaseToken,
            }
          )
        : acknowledgePurchaseOnBackend({
            itemId: purchaseOption.itemId,
            purchaseToken,
          });

      const result = await purchaseFunction;

      if (result.status === ApiCallResult.Success) {
        try {
          const digitalGoodsService = await buildDigitalGoodsService();
          // Optional: consume the purchase, allowing the user to purchase
          // the same item again.
          await digitalGoodsService.consume(purchaseToken);

          // Optional: tell the PaymentRequest API the validation was
          // successful. The user-agent may show a "payment successful"
          // message to the user.
          await completeResponse("success");
        } catch (error: unknown) {
          console.log(error);
          dispatch(
            setAndShowAlert({
              message: `Consuming purchase token or completing response failed for "${title}" due to the error`,
              alertType: AlertType.Error,
            })
          );
          return;
        }
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
        try {
          await completeResponse("fail");
        } catch (error: unknown) {
          console.log(error);
          dispatch(
            setAndShowAlert({
              message: `Completing response failed for "${title}" due to the error`,
              alertType: AlertType.Error,
            })
          );
          return;
        }
        dispatch(
          setAndShowAlert({
            message: `Cannot acknowledge the purchase for "${title}". It will be auto refunded in 3 days by Google unless acknowlege succeeds (it can happen when you launch the app)`,
            alertType: AlertType.Error,
          })
        );
        return;
      }
    } finally {
      setIsLoading(false);
    }
  };

  return makePurchase;
};
