import { TierKey } from "@/lib/tiers";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  ApiCallResult,
  acknowledgePurchaseOnBackend,
  clearSubscriptionCookieOnBackend,
} from "../apiClient";
import { useDigitalGoodsService } from "../context/DIgitalGoodsServiceProvider";
import { AlertType } from "../data/alertType";
import { buildDigitalGoodsService } from "../helpers/serviceHelper";
import {
  hasQueryParam,
  reloadPageWithQueryParam,
  removeParamsFromQuery,
} from "../helpers/urlHelper";
import { setAndShowAlert } from "../store/uiSlice";

const NO_RELOAD_QUERY_PARAM = "noReload";

export const reloadOnce = () =>
  reloadPageWithQueryParam(NO_RELOAD_QUERY_PARAM, "true"); // this should take the subscriptionTier from cookie and reload the page. Only do it once

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
  const hasDigitalGoodsService = useDigitalGoodsService();
  // TODO We need to be able to change subscription in google play. https://developer.android.com/google/play/billing/subscriptions

  const dispatch = useDispatch();
  useEffect(() => {
    const listGooglePlayPurchases = async () => {
      if (!hasDigitalGoodsService) {
        return;
      }

      if (hasQueryParam(NO_RELOAD_QUERY_PARAM)) {
        removeParamsFromQuery();
        // It's just been reloaded - no need to reload further
        return;
      }

      // It takes the purchased subscription from DigitalGoodsService and sends it to backend for validation. Backend sets the cookie with permissions. Then location is reloaded
      const digitalGoodsService = await buildDigitalGoodsService();
      const existingPurchases = await digitalGoodsService.listPurchases();
      alert(JSON.stringify(existingPurchases));
      if (existingPurchases.length) {
        const purchaseToProcess = existingPurchases.sort(sortByItemId)[0];
        const result = await acknowledgePurchaseOnBackend({
          itemId: purchaseToProcess.itemId as TierKey,
          purchaseToken: purchaseToProcess.purchaseToken,
        });

        alert(JSON.stringify(purchaseToProcess));
        alert(JSON.stringify(result));

        if (result === ApiCallResult.Success) {
          // adding a query param to avoid endless reloads
          reloadOnce();
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
        const result = await clearSubscriptionCookieOnBackend();
        if (result === ApiCallResult.Success) {
          // adding a query param to avoid endless reloads
          reloadOnce();
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
    };
    listGooglePlayPurchases();
    //Dependencies should be empty to avoid endless reload
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
