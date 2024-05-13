import { selectAuth } from "@/app/store/authSlice";
import { GOOGLE_PLAY_SUBSCRIPTION_COOKIE_KEY } from "@/lib/purchaseParams";
import { TierKey } from "@/lib/tiers";
import { deleteCookie } from "cookies-next";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { AcknowledgeResult, acknowledgePurchaseOnBackend } from "../apiClient";
import { useDigitalGoodsService } from "../context/DIgitalGoodsServiceProvider";
import { buildDigitalGoodsService } from "../helpers/serviceHelper";
import { hasQueryParam, reloadPageWithQueryParam } from "../helpers/urlHelper";

export const GOOGLE_PLAY_AUTH_QUERY_PARAM = "noReload";

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

const clearSubscriptionCookie = () => {
  deleteCookie(GOOGLE_PLAY_SUBSCRIPTION_COOKIE_KEY);
  console.log("Subscription cookie cleared");
};

// This hook reloads the page as the server should set the right permissions after the client sends the purchase info to it
export const useGooglePlayAuth = () => {
  const hasDigitalGoodsService = useDigitalGoodsService();
  const { subscriptionTier } = useSelector(selectAuth);
  // TODO We need to be able to change subscription in google play. https://developer.android.com/google/play/billing/subscriptions

  useEffect(() => {
    const listGooglePlayPurchases = async () => {
      if (!hasDigitalGoodsService) {
        return;
      }

      const digitalGoodsService = await buildDigitalGoodsService();
      const existingPurchases = await digitalGoodsService.listPurchases();
      if (existingPurchases.length) {
        const purchaseToProcess = existingPurchases.sort(sortByItemId)[0];
        const acknowledgeResult = await acknowledgePurchaseOnBackend({
          itemId: purchaseToProcess.itemId as TierKey,
          purchaseToken: purchaseToProcess.purchaseToken,
        });

        if (acknowledgeResult === AcknowledgeResult.Success) {
          // adding a query param to avoid endless reloads
          if (!hasQueryParam(GOOGLE_PLAY_AUTH_QUERY_PARAM)) {
            console.log("Reloading page");
            reloadPageWithQueryParam(GOOGLE_PLAY_AUTH_QUERY_PARAM, "true"); // this should take the subscriptionTier from cookie and reload the page. Only do it once
          }
        }
      } else {
        clearSubscriptionCookie();
      }
    };
    listGooglePlayPurchases();
    //Dependencies should be empty to avoid endless reload
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
