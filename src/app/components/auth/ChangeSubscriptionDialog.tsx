import { DialogWrapper } from "@/app/components/uiFramework/DialogWrapper";
import { useDigitalGoodsServiceInfo } from "@/app/context/DigitalGoodsServiceInfoProvider";
import { CHANGE_SUBSCRIPTION_DIALOG } from "@/app/data/elementIds";
import {
  GetSubscriptionActionParams,
  getMakePurchase,
} from "@/app/helpers/getMakePurchase";
import {
  getChangeAction,
  getExistingNonCancelledPurchase,
} from "@/app/helpers/purchaseOptionHelper";
import { CancellationMode } from "@/lib/apiTypes";
import { msToFormattedDate } from "@/lib/dateHelper";
import { Alert, Button } from "@mui/material";
import { FC } from "react";
import { useDispatch } from "react-redux";
import { DialogProps } from "../DialogProps";

export const ChangeSubscriptionDialog: FC<
  DialogProps & GetSubscriptionActionParams
> = (params) => {
  const {
    isOpen,
    handleCloseDialog,
    purchaseOption,
    disabledMessage,
    allPurchasedOptions,
  } = params;
  const dispatch = useDispatch();
  const hasDigitalGoodsService = useDigitalGoodsServiceInfo();

  const makePurchase = getMakePurchase(
    params,
    hasDigitalGoodsService,
    dispatch
  );

  const existingNotCancelledPurchaseOption = getExistingNonCancelledPurchase(
    allPurchasedOptions,
    purchaseOption
  );

  if (!existingNotCancelledPurchaseOption) {
    return;
  }

  const existingSubscriptionExpirationDate = msToFormattedDate(
    existingNotCancelledPurchaseOption?.expirationDateMs
  );
  const existingSubscriptionSubscribedDate = msToFormattedDate(
    existingNotCancelledPurchaseOption?.subscribedDateMs
  );
  const existingSubscriptionExpirationDateText =
    existingSubscriptionExpirationDate !== undefined
      ? ` ${existingSubscriptionExpirationDate}`
      : "";
  const existingSubscriptionSubscribedDateText =
    existingSubscriptionSubscribedDate !== undefined
      ? ` (${existingSubscriptionSubscribedDate})`
      : "";

  const changeAction = getChangeAction(existingNotCancelledPurchaseOption)!;
  const existingSubscriptionCancellationMode =
    existingNotCancelledPurchaseOption.cancellationMode;

  const existingSubscriptionTitle = existingNotCancelledPurchaseOption.tier;
  const newSubscriptionTitle = purchaseOption.tier;

  return (
    <DialogWrapper
      darkBackdrop
      anchor="top"
      isOpen={isOpen}
      close={handleCloseDialog}
      headerText={`Are you sure you would like to ${changeAction.toLocaleLowerCase()} your "${existingSubscriptionTitle}" subscription?`}
      id={CHANGE_SUBSCRIPTION_DIALOG}
    >
      <Alert severity="info">
        {existingSubscriptionCancellationMode === CancellationMode.Revoke
          ? `Subscription was purchased recently${existingSubscriptionSubscribedDateText}. It will be revoked immediately and refunded, the new subscription will take effect immediately`
          : `Subscription was purchased a while ago${existingSubscriptionSubscribedDateText}. It will be cancelled but not refunded. ${
              changeAction === "Upgrade"
                ? " As the new subscription upgrades existing it will take effect immediately"
                : ` As the new subscription is a downgrade from existing - you'll own the existing one till its expiration date${existingSubscriptionExpirationDateText}. Then the new subscription will take effect`
            }`}
      </Alert>

      <Button
        size="small"
        onClick={handleCloseDialog}
        variant="contained"
        color="secondary"
        title={`Don't ${changeAction.toLocaleLowerCase()} subscription`}
      >
        {`No, I'd prefer to keep my existing subscription "${existingSubscriptionTitle}"`}
      </Button>
      <Button
        disabled={disabledMessage !== undefined}
        size="small"
        onClick={makePurchase}
        variant="contained"
        color="primary"
        title={`${changeAction} subscription`}
      >
        {`${changeAction} subscription from "${existingSubscriptionTitle}" to "${newSubscriptionTitle}"`}
      </Button>
    </DialogWrapper>
  );
};
