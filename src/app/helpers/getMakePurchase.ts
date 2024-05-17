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
      const purchaseResult = await showGooglePlayPurchaseUiAndSubscribe(
        dispatch,
        purchaseOption
      );
      if (!purchaseResult) {
        return;
      }
      const { completeResponse, purchaseToken } = purchaseResult;
      const purchaseFunction = getPurchaseFunction(
        existingNotCancelledPurchaseOption,
        purchaseOption,
        purchaseToken
      );

      const result = await purchaseFunction;

      if (result.status === ApiCallResult.Success) {
        const digitalGoodsService = await buildDigitalGoodsService();
        await consumePurchaseToken(
          digitalGoodsService,
          purchaseToken,
          dispatch,
          title
        );
        await completeSuccessfulResponse(completeResponse, dispatch, title);
        const message = `Payment successful! Your level is "${title}"`;
        console.log(message);
        dispatch(
          setAndShowAlert({
            message,
          })
        );
        await incrementAndReload(GOOGLE_PLAY_RELOAD_KEY, 0, dispatch, message);
      } else if (result.status === ApiCallResult.SkipProcessing) {
        const message = `"${title}" is cancelled. Cannot acknowledge`;
        console.log(message);
        dispatch(
          setAndShowAlert({
            message,
            alertType: AlertType.Warning,
          })
        );
      } else {
        await completeFailedResonse(completeResponse, dispatch, title);
        const message = `Cannot acknowledge the purchase for "${title}". It will be auto refunded in 3 days by Google unless acknowlege succeeds (it can happen when you launch the app)`;
        console.error(message);
        dispatch(
          setAndShowAlert({
            message,
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

function getPurchaseFunction(
  existingNotCancelledPurchaseOption: PurchaseOption | undefined,
  purchaseOption: PurchaseOption,
  purchaseToken: string
) {
  return existingNotCancelledPurchaseOption?.purchaseToken // this should always be true, just to satisfy the compiler
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
}

async function showGooglePlayPurchaseUiAndSubscribe(
  dispatch: Dispatch<UnknownAction>,
  purchaseOption: PurchaseOption
) {
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
}

async function completeFailedResonse(
  completeResponse: (result?: PaymentComplete | undefined) => Promise<void>,
  dispatch: Dispatch<UnknownAction>,
  title: string
) {
  try {
    // Optional: tell the PaymentRequest API the validation was not
    // successful. The user-agent may show a "payment failed"
    // message to the user.
    await completeResponse("fail");
  } catch (error: unknown) {
    console.log(error);
    dispatch(
      setAndShowAlert({
        message: `Completing response (marking it as failed) was not successful for "${title}" due to an error`,
        alertType: AlertType.Error,
      })
    );
  }
}

async function completeSuccessfulResponse(
  completeResponse: (result?: PaymentComplete | undefined) => Promise<void>,
  dispatch: Dispatch<UnknownAction>,
  title: string
) {
  try {
    // Optional: tell the PaymentRequest API the validation was
    // successful. The user-agent may show a "payment successful"
    // message to the user.
    await completeResponse("success");
  } catch (error: unknown) {
    console.log(error);
    dispatch(
      setAndShowAlert({
        message: `Completing response (marking it as successful) was not successful for "${title}" due to an error`,
        alertType: AlertType.Error,
      })
    );
  }
}

async function consumePurchaseToken(
  digitalGoodsService: DigitalGoodsService,
  purchaseToken: string,
  dispatch: Dispatch<UnknownAction>,
  title: string
) {
  try {
    // Optional: consume the purchase, allowing the user to purchase
    // the same item again.
    await digitalGoodsService.consume(purchaseToken);
  } catch (error: unknown) {
    console.log(error);
    dispatch(
      setAndShowAlert({
        message: `Consuming purchase token was not successful for "${title}" due to an error`,
        alertType: AlertType.Error,
      })
    );
  }
}
