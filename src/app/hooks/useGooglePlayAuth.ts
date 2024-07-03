import { useAuthSelector } from "@/app/hooks/storeHooks";
import { SubscriptionProvider } from "@/lib/subscriptionProvider";
import { TierKey } from "@/lib/tier";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  ApiCallResult,
  acknowledgePurchaseOnBackend,
  logoutOnBackend,
} from "../apiClient";
import { useDigitalGoodsServiceInfo } from "../context/DigitalGoodsServiceInfoProvider";
import { AlertType } from "../data/alertType";
import { GuitarUpscaleSpecificPurchaseDetails } from "../digitalGoodsBrowser";
import { processWithReloads } from "../helpers/reloadHelper";
import { buildDigitalGoodsService } from "../helpers/serviceHelper";
import { setAndShowAlert } from "../store/uiSlice";
import { useInterval } from "./useInterval";
import { useOnlineStatus } from "./useOnlineStatus";

export const GOOGLE_PLAY_RELOAD_KEY = "GOOGLE_PLAY_RELOAD_COUNT";

const ONE_MINUTE = 1 * 60 * 1000;

function sortByItemId(
  itemA: { itemId: string },
  itemB: { itemId: string }
): number {
  if (itemA.itemId === "guitar_upscale.composer") {
    return -1; // itemA should come before itemB
  }
  if (itemB.itemId === "guitar_upscale.composer") {
    return 1; // itemB should come before itemA
  }
  return 0; // No change in order
}

// This hook reloads the page as the server should set the right permissions after the client sends the purchase info to it
export const useGooglePlayAuth = () => {
  const subscriptionTier = useAuthSelector((s) => s.subscriptionTier);
  const hasDigitalGoodsService = useDigitalGoodsServiceInfo();
  const isOnline = useOnlineStatus();
  // https://developer.android.com/google/play/billing/subscriptions
  // https://chromeos.dev/en/publish/play-billing-backend
  // https://medium.com/androiddevelopers/implementing-linkedpurchasetoken-correctly-to-prevent-duplicate-subscriptions-82dfbf7167da
  // https://developer.android.com/google/play/billing/lifecycle/subscriptions#upgrades-downgrades

  useInterval(async () => {
    void checkPermissionsMismatch();
  }, ONE_MINUTE);

  const dispatch = useDispatch();
  const checkPermissionsMismatch = async () => {
    if (!hasDigitalGoodsService) {
      return;
    }

    if (!isOnline) {
      console.log("Offline. Skipping permissions mismatch check");
      return;
    }

    console.log("Checking permissions mismatch");

    // It takes the purchased subscription from DigitalGoodsService and sends it to backend for validation. Backend sets the cookie with permissions. Then location is reloaded
    const digitalGoodsService = await buildDigitalGoodsService();
    const existingPurchases =
      (await digitalGoodsService.listPurchases()) as GuitarUpscaleSpecificPurchaseDetails[];

    await processWithReloads(
      dispatch,
      GOOGLE_PLAY_RELOAD_KEY,
      () => {
        const hasGooglePlaySubscription =
          subscriptionTier?.provider === SubscriptionProvider.GooglePlay;

        console.log(
          `Existing purchases: ${existingPurchases.length}; subscription tier`,
          subscriptionTier
        );
        return (
          (existingPurchases.length && !hasGooglePlaySubscription) ||
          (hasGooglePlaySubscription && !existingPurchases.length)
        );
      },
      async () => {
        if (existingPurchases.length) {
          const logMessage = `Granting permissions`;
          console.log(logMessage);
          const purchaseToProcess = existingPurchases.sort(sortByItemId)[0];
          const result = await acknowledgePurchaseOnBackend({
            itemId: purchaseToProcess.itemId as TierKey,
            purchaseToken: purchaseToProcess.purchaseToken,
          });

          if (result.status === ApiCallResult.Success) {
            // reloading the page - after reload the permissions will be taken from the cookie which should be already set during acknowledge
            return {
              shouldReload: true,
              message: logMessage,
            };
          } else if (result.status === ApiCallResult.SkipProcessing) {
            console.log(
              "Skipped permissions mismatch processing. Subscription is cancelled"
            );
            return {
              shouldReload: false,
            };
          } else {
            dispatch(
              setAndShowAlert({
                message:
                  "There's a purchase listed in Google Play but it cannot be acknowledged due to an error",
                alertType: AlertType.Error,
              })
            );
            return {
              shouldReload: false,
            };
          }
        } else {
          const logMessage = "Revoking expired permissions";
          console.log(logMessage);
          const result = await logoutOnBackend();
          if (result.status === ApiCallResult.Success) {
            // reloading the page - after reload the permissions will be taken from the cookie which should be already set during acknowledge
            return {
              shouldReload: true,
              message: logMessage,
            };
          } else {
            dispatch(
              setAndShowAlert({
                message:
                  "There are no subscriptions listed in Google Play but logout cannot be processed due to an error",
                alertType: AlertType.Error,
              })
            );
            return {
              shouldReload: false,
            };
          }
        }
      },
      () => {},
      () => {}
    );
  };

  useEffect(() => {
    void checkPermissionsMismatch();
    //Dependencies should be empty to avoid endless reload
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);
};
