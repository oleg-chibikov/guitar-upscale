import { UnknownAction } from "@reduxjs/toolkit";
import { Dispatch } from "react";
import { ApiCallResult, cancelPurchaseOnBackend } from "../apiClient";
import { AlertType } from "../data/alertType";
import { GOOGLE_PLAY_RELOAD_KEY } from "../hooks/useGooglePlayAuth";
import { setAndShowAlert } from "../store/uiSlice";
import {
  GetSubscriptionActionParams,
  getTierInfoMessage,
} from "./getMakePurchase";
import { getExistingCancelledPurchase } from "./purchaseOptionHelper";
import { READ_MESSAGE_WAIT_TIME, incrementAndReload } from "./reloadHelper";

export const getCancelSubscription = (
  {
    purchaseOption,
    setIsLoading,
    disabledMessage,
    allPurchasedOptions,
  }: GetSubscriptionActionParams,
  hasDigitalGoodsService: boolean,
  dispatch: Dispatch<UnknownAction>,
) => {
  const cancelSubscription = async () => {
    if (!hasDigitalGoodsService) {
      return;
    }
    if (disabledMessage !== undefined) {
      console.log(disabledMessage);
      return;
    }
    if (!purchaseOption.purchaseData) {
      return;
    }
    setIsLoading(true);
    try {
      const cancelResult = await cancelPurchaseOnBackend(
        purchaseOption.purchaseData,
        getExistingCancelledPurchase(allPurchasedOptions, purchaseOption),
      );
      if (cancelResult.status === ApiCallResult.Success) {
        const tierInfoMessage = getTierInfoMessage(cancelResult.data);
        const message = `Cancellation successful! ${tierInfoMessage}`;
        dispatch(
          setAndShowAlert({
            message: "Success",
            alertType: AlertType.Success,
          }),
        );
        await incrementAndReload(
          GOOGLE_PLAY_RELOAD_KEY,
          0,
          dispatch,
          message,
          READ_MESSAGE_WAIT_TIME,
        );
      } else if (cancelResult.status === ApiCallResult.SkipProcessing) {
        dispatch(
          setAndShowAlert({
            message: `Subscription "${purchaseOption.tier}" is already cancelled`,
            alertType: AlertType.Warning,
          }),
        );
      } else {
        dispatch(
          setAndShowAlert({
            message: `Cannot cancel the subscription "${purchaseOption.tier}" due to an error`,
            alertType: AlertType.Error,
          }),
        );
      }
    } catch (e) {
      console.log(e);
      dispatch(
        setAndShowAlert({
          message: "Cancellation aborted",
          alertType: AlertType.Warning,
        }),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return cancelSubscription;
};
