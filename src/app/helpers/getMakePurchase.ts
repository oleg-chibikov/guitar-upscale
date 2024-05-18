import {
  ChangeResponseData,
  SubscriptionActionResponseData,
} from "@/lib/apiTypes";
import { PurchaseParams } from "@/lib/purchaseParams";
import { UnknownAction } from "@reduxjs/toolkit";
import { Dispatch } from "react";
import {
  ApiCallResult,
  Response,
  acknowledgePurchaseOnBackend,
  changePurchaseOnBackend,
} from "../apiClient";
import {
  PurchaseOption,
  PurchasedOption,
} from "../components/auth/GooglePlayPurchaseSection";
import { AlertType } from "../data/alertType";
import { GOOGLE_PLAY_RELOAD_KEY } from "../hooks/useGooglePlayAuth";
import { setAndShowAlert } from "../store/uiSlice";
import {
  getExistingCancelledPurchase,
  getExistingNonCancelledPurchase,
} from "./purchaseOptionHelper";
import { incrementAndReload } from "./reloadHelper";

export interface GetMakePurchaseParams {
  purchaseOption: PurchaseOption;
  setIsLoading: (isLoading: boolean) => void;
  disabledMessage?: string;
  allPurchasedOptions: PurchasedOption[];
}

export const getMakePurchase = (
  {
    purchaseOption,
    setIsLoading,
    disabledMessage,
    allPurchasedOptions,
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

    setIsLoading(true);
    try {
      const paymentResponse = await showGooglePlayPurchaseUiAndSubscribe(
        dispatch,
        purchaseOption
      );
      if (!paymentResponse) {
        return;
      }

      const existingNotCancelledPurchaseOption =
        getExistingNonCancelledPurchase(allPurchasedOptions, purchaseOption);

      const purchaseParams: PurchaseParams = {
        itemId: purchaseOption.details.itemId,
        purchaseToken: paymentResponse.details.purchaseToken,
      };

      let result: Response<SubscriptionActionResponseData | ChangeResponseData>;
      let actionString: string;

      if (existingNotCancelledPurchaseOption) {
        result = await changePurchaseOnBackend(
          purchaseParams,
          existingNotCancelledPurchaseOption
        );
        actionString = "change";
      } else {
        result = await acknowledgePurchaseOnBackend(
          purchaseParams,
          getExistingCancelledPurchase(allPurchasedOptions, purchaseOption)
        );
        actionString = "acknowledge";
      }

      if (result.status === ApiCallResult.Success) {
        // const digitalGoodsService = await buildDigitalGoodsService();
        // const consumeResult = await consumePurchaseToken(
        //   digitalGoodsService,
        //   purchaseToken,
        //   dispatch,
        //   title
        // );
        // if (!consumeResult) {
        //   return;
        // }
        const completeResult = await completeSuccessfulResponse(
          paymentResponse,
          dispatch,
          purchaseOption.tier
        );
        if (!completeResult) {
          return;
        }

        let prefix = "Payment for";
        const changeAction = (result.data as ChangeResponseData).changeAction;
        if (changeAction) {
          prefix = changeAction + " to";
        }

        let postfix: string = "";
        const wasDeferred = (result.data as ChangeResponseData).wasDeferred;
        if (wasDeferred === true) {
          postfix =
            ". Your new tier will become active when the cancelled subscription expires";
        } else if (wasDeferred === false) {
          postfix = ". Your new tier will become active immediately";
        }

        // TODO: Add better message when it's a change
        const message = `${prefix} "${
          purchaseOption.tier
        }" successful! Your current subscription level is "${
          result.data.newTier
        }"${
          !result.data.tierChanged
            ? ". Current tier was not changed as your cancelled subscription is still active till its expiry"
            : ""
        }${postfix}`;
        console.log(message);
        dispatch(
          setAndShowAlert({
            message,
          })
        );
        await incrementAndReload(GOOGLE_PLAY_RELOAD_KEY, 0, dispatch, message);
      } else if (result.status === ApiCallResult.SkipProcessing) {
        const message = `Subscription is already cancelled. Cannot ${actionString} it`;
        console.log(message);
        dispatch(
          setAndShowAlert({
            message,
            alertType: AlertType.Warning,
          })
        );
      } else {
        const completeResult = await completeFailedResonse(
          paymentResponse,
          dispatch,
          purchaseOption.tier
        );
        if (!completeResult) {
          return;
        }
        const message = `Cannot ${actionString} subscription. It will be auto refunded in 3 days by Google unless acknowlege succeeds (it can happen when you launch the app)`;
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

async function showGooglePlayPurchaseUiAndSubscribe(
  dispatch: Dispatch<UnknownAction>,
  purchaseOption: PurchaseOption
) {
  // Define the preferred payment method and item ID
  const paymentMethods: PaymentMethodData[] = [
    {
      supportedMethods: "https://play.google.com/billing",
      data: {
        sku: purchaseOption.details.itemId,
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
  try {
    paymentResponse = await request.show();
    return paymentResponse;
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
  paymentResponse: PaymentResponse,
  dispatch: Dispatch<UnknownAction>,
  title: string
) {
  try {
    // Optional: tell the PaymentRequest API the validation was not
    // successful. The user-agent may show a "payment failed"
    // message to the user.
    await paymentResponse.complete("fail");
    return true;
  } catch (error: unknown) {
    console.log(error);
    dispatch(
      setAndShowAlert({
        message: `Completing response (marking it as failed) was not successful for "${title}" due to an error`,
        alertType: AlertType.Error,
      })
    );
    return false;
  }
}

async function completeSuccessfulResponse(
  paymentResponse: PaymentResponse,
  dispatch: Dispatch<UnknownAction>,
  title: string
) {
  try {
    // Optional: tell the PaymentRequest API the validation was
    // successful. The user-agent may show a "payment successful"
    // message to the user.
    await paymentResponse.complete("success");
    return true;
  } catch (error: unknown) {
    console.log(error);
    dispatch(
      setAndShowAlert({
        message: `Completing response (marking it as successful) was not successful for "${title}" due to an error`,
        alertType: AlertType.Error,
      })
    );
    return false;
  }
}

// Looks like this code is not applicable to subscriptions. It throws errors and the description also tells that it's designed for repurchasing, while for subscriptions we need to cancel them to repurchase
// Leaving it here for now, but may be deleted later

// async function consumePurchaseToken(
//   digitalGoodsService: DigitalGoodsService,
//   purchaseToken: string,
//   dispatch: Dispatch<UnknownAction>,
//   title: string
// ) {
//   try {
//     // Optional: consume the purchase, allowing the user to purchase
//     // the same item again.
//     await digitalGoodsService.consume(purchaseToken);
//     return true;
//   } catch (error: unknown) {
//     console.log(error);
//     dispatch(
//       setAndShowAlert({
//         message: `Consuming purchase token was not successful for "${title}" due to an error`,
//         alertType: AlertType.Error,
//       })
//     );
//     return false;
//   }
// }
