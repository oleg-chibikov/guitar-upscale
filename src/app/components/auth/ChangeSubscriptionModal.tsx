import { DialogContentWrapper } from "@/app/components/layout/DialogContentWrapper";
import { useDigitalGoodsServiceInfo } from "@/app/context/DigitalGoodsServiceInfoProvider";
import {
  GetSubscriptionActionParams,
  getMakePurchase,
} from "@/app/helpers/getMakePurchase";
import {
  getChangeAction,
  getExistingNonCancelledPurchase,
} from "@/app/helpers/purchaseOptionHelper";
import { selectUi } from "@/app/store/uiSlice";
import { CancellationMode } from "@/lib/apiTypes";
import { msToFormattedDate } from "@/lib/dateHelper";
import { Alert, Button, Drawer } from "@mui/material";
import { FC, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ModalProps } from "../ModalProps";

export const ChangeSubscriptionModal: FC<
  ModalProps & GetSubscriptionActionParams
> = (params) => {
  const {
    isOpen,
    handleCloseModal,
    purchaseOption,
    disabledMessage,
    allPurchasedOptions,
  } = params;
  const { theme } = useSelector(selectUi);
  const dispatch = useDispatch();
  const hasDigitalGoodsService = useDigitalGoodsServiceInfo();
  const [open, setOpen] = useState<boolean>(false); // this is needed to use animation when loaded first time

  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

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
    <Drawer
      slotProps={{
        backdrop: { style: { backgroundColor: "rgba(0,0,0,0.9)" } },
      }}
      anchor="top"
      open={open}
      onClose={handleCloseModal}
      aria-labelledby="change-subscription-modal"
    >
      <DialogContentWrapper
        headerText={`Are you sure you would like to ${changeAction.toLocaleLowerCase()} your "${existingSubscriptionTitle}" subscription?`}
        className="justify-center text-center items-stretch"
        onClose={handleCloseModal}
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
          onClick={handleCloseModal}
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
      </DialogContentWrapper>
    </Drawer>
  );
};
