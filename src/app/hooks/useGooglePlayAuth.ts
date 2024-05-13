import { selectAuth } from "@/app/store/authSlice";
import { TierKey } from "@/lib/tiers";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { AcknowledgeResult, acknowledgePurchaseOnBackend } from "../apiClient";
import { useDigitalGoodsService } from "../context/DIgitalGoodsServiceProvider";
import { buildDigitalGoodsService } from "../helpers/serviceHelper";

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
  const { subscriptionTier } = useSelector(selectAuth);

  useEffect(() => {
    const listGooglePlayPurchases = async () => {
      if (!hasDigitalGoodsService) {
        return;
      }
      if (subscriptionTier) {
        // TODO: We need to check google play purchases anyway and if there is no subscription anymore - remove the cookie and reload
        // TODO We need to be able to change subscription in google play. https://developer.android.com/google/play/billing/subscriptions
        console.log(
          "Subscription tier available, no need to list purchases",
          subscriptionTier
        );
        localStorage.removeItem("googlePlaySignInCheckCount");
        return;
      }

      const signInCheckCountRaw = localStorage.getItem(
        "googlePlaySignInCheckCount"
      );
      const signInCheckCount =
        signInCheckCountRaw !== null ? parseInt(signInCheckCountRaw) : 0;
      console.log("Google Play session reload count", signInCheckCount);

      if (signInCheckCount > 1) {
        console.log(
          "Google Play session check reload count exceeded limit. Avoid further reload"
        );
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
          console.log("Reloading page");
          // check to avoid endless reloads
          localStorage.setItem(
            "googlePlaySignInCheckCount",
            (signInCheckCount + 1).toString()
          );
          location.reload(); // this should take the subscriptionTier from cookie and reload page
        }
      }
    };
    listGooglePlayPurchases();
    //Dependencies should be empty to avoid endless reload
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
