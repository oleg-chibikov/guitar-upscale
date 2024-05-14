import { SubscriptionProvider } from "@/lib/subscriptionProvider";
import { TierKey } from "@/lib/tiers";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ApiCallResult,
  acknowledgePurchaseOnBackend,
  clearSubscriptionCookieOnBackend,
} from "../apiClient";
import { useDigitalGoodsService } from "../context/DIgitalGoodsServiceProvider";
import { AlertType } from "../data/alertType";
import {
  clearReloadCount,
  getReloadCount,
  incrementAndReload,
} from "../helpers/reloadHelper";
import { buildDigitalGoodsService } from "../helpers/serviceHelper";
import { selectAuth } from "../store/authSlice";
import { setAndShowAlert } from "../store/uiSlice";

export const GOOGLE_PLAY_RELOAD_KEY = "GOOGLE_PLAY_RELOAD_COUNT";

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
  const { subscriptionTier } = useSelector(selectAuth);
  const hasDigitalGoodsService = useDigitalGoodsService();
  // TODO We need to be able to change subscription in google play. https://developer.android.com/google/play/billing/subscriptions

  const dispatch = useDispatch();
  useEffect(() => {
    const listGooglePlayPurchases = async () => {
      if (!hasDigitalGoodsService) {
        return;
      }

      const reloadCount = getReloadCount(GOOGLE_PLAY_RELOAD_KEY);

      if (reloadCount > 2) {
        // Reload attempts exceeded
        return;
      }

      // It takes the purchased subscription from DigitalGoodsService and sends it to backend for validation. Backend sets the cookie with permissions. Then location is reloaded
      const digitalGoodsService = await buildDigitalGoodsService();
      const existingPurchases = await digitalGoodsService.listPurchases();
      const hasGooglePlaySubscription =
        subscriptionTier?.provider === SubscriptionProvider.GooglePlay;
      const isMismatch =
        (existingPurchases.length && !hasGooglePlaySubscription) ||
        (hasGooglePlaySubscription && !existingPurchases.length);
      subscriptionTier?.provider !== SubscriptionProvider.GooglePlay;
      if (isMismatch) {
        // mismatch in status - need to grant the permissions and reload
        console.log(
          "Mismatch in the Google play session status - reload needed"
        );
        if (existingPurchases.length) {
          console.log(
            "Google Play api mentions purchases but there are no permissions"
          );
          const purchaseToProcess = existingPurchases.sort(sortByItemId)[0];
          const result = await acknowledgePurchaseOnBackend({
            itemId: purchaseToProcess.itemId as TierKey,
            purchaseToken: purchaseToProcess.purchaseToken,
          });

          if (result === ApiCallResult.Success) {
            // reloading the page - after reload the permissions will be taken from the cookie which should be already set during acknowledge
            incrementAndReload(GOOGLE_PLAY_RELOAD_KEY, reloadCount);
          } else {
            dispatch(
              setAndShowAlert({
                message:
                  "There's a purchase listed in Google Play but it cannot be acknowledged due to an error",
                alertType: AlertType.Error,
              })
            );
          }
        } else {
          console.log(
            "Google Play api mentions no purchases but there are permissions"
          );
          const result = await clearSubscriptionCookieOnBackend();
          if (result === ApiCallResult.Success) {
            // reloading the page - after reload the permissions will be taken from the cookie which should be already set during acknowledge
            incrementAndReload(GOOGLE_PLAY_RELOAD_KEY, reloadCount);
          } else {
            dispatch(
              setAndShowAlert({
                message:
                  "There are no subscriptions listed in Google Play but logout cannot be processed due to an error",
                alertType: AlertType.Error,
              })
            );
          }
        }
      } else {
        console.log(
          "No mismatch in the Google play session status - no reload needed"
        );
        clearReloadCount(GOOGLE_PLAY_RELOAD_KEY);
      }
    };
    listGooglePlayPurchases();
    //Dependencies should be empty to avoid endless reload
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
