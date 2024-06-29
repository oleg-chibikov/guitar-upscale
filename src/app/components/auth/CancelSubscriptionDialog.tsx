import { DialogWrapper } from "@/app/components/uiFramework/DialogWrapper";
import { useDigitalGoodsServiceInfo } from "@/app/context/DigitalGoodsServiceInfoProvider";
import { CANCEL_SUBSCRIPTION_DIALOG } from "@/app/data/elementIds";
import { getCancelSubscription } from "@/app/helpers/getCancelSubscription";
import { GetSubscriptionActionParams } from "@/app/helpers/getMakePurchase";
import { CancellationMode } from "@/lib/apiTypes";
import { msToFormattedDate } from "@/lib/dateHelper";
import { Alert, Button } from "@mui/material";
import { FC } from "react";
import { useDispatch } from "react-redux";
import { DialogProps } from "../DialogProps";

export const CancelSubscriptionDialog: FC<
  DialogProps & GetSubscriptionActionParams
> = (params) => {
  const { isOpen, handleCloseDialog, purchaseOption, disabledMessage } = params;
  const title = purchaseOption.tier;

  const dispatch = useDispatch();
  const hasDigitalGoodsService = useDigitalGoodsServiceInfo();
  const cancelSubscription = getCancelSubscription(
    params,
    hasDigitalGoodsService,
    dispatch
  );

  const purchaseData = purchaseOption.purchaseData;
  const expirationDate = msToFormattedDate(purchaseData?.expirationDateMs);
  const subscribedDate = msToFormattedDate(purchaseData?.subscribedDateMs);
  const expirationDateText =
    expirationDate !== undefined ? ` ${expirationDate}` : "";
  const subscribedDateText =
    subscribedDate !== undefined ? ` (${subscribedDate})` : "";
  const cancellationMode = purchaseData?.cancellationMode;

  return (
    <DialogWrapper
      darkBackdrop
      anchor="top"
      isOpen={isOpen}
      close={handleCloseDialog}
      headerText={`Are you sure you would like to cancel your "${title}" subscription?`}
      id={CANCEL_SUBSCRIPTION_DIALOG}
    >
      {cancellationMode !== undefined ? (
        <Alert severity="info">
          {cancellationMode === CancellationMode.Revoke
            ? `Subscription was purchased recently${subscribedDateText}. It will be revoked immediately and refunded`
            : `Subscription was purchased a while ago${subscribedDateText}. It will be cancelled but you'll own it till its expiration date${expirationDateText}`}
        </Alert>
      ) : undefined}
      <Button
        size="small"
        onClick={handleCloseDialog}
        variant="contained"
        color="secondary"
        title="Don't cancel"
      >
        {"No, I'd prefer to keep it"}
      </Button>
      <Button
        disabled={disabledMessage !== undefined}
        size="small"
        onClick={cancelSubscription}
        variant="contained"
        color="error"
        title="Cancel subscription"
      >
        Cancel subscription
      </Button>
    </DialogWrapper>
  );
};
