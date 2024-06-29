import { DialogContentWrapper } from "@/app/components/layout/DialogContentWrapper";
import { useDigitalGoodsServiceInfo } from "@/app/context/DigitalGoodsServiceInfoProvider";
import { getCancelSubscription } from "@/app/helpers/getCancelSubscription";
import { GetSubscriptionActionParams } from "@/app/helpers/getMakePurchase";
import { selectUi } from "@/app/store/uiSlice";
import { CancellationMode } from "@/lib/apiTypes";
import { msToFormattedDate } from "@/lib/dateHelper";
import { Alert, Button, Modal, Slide } from "@mui/material";
import { FC } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ModalProps } from "../ModalProps";

export const CancelSubscriptionModal: FC<
  ModalProps & GetSubscriptionActionParams
> = (params) => {
  const { isOpen, handleCloseModal, purchaseOption, disabledMessage } = params;
  const { theme } = useSelector(selectUi);
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
    <Modal
      slotProps={{
        backdrop: { style: { backgroundColor: "rgba(0,0,0,0.9)" } },
      }}
      open={isOpen}
      onClose={handleCloseModal}
      aria-labelledby="cancel-subscription-modal"
    >
      <Slide direction="down" in={isOpen} mountOnEnter unmountOnExit>
        <DialogContentWrapper
          headerText={`Are you sure you would like to cancel your "${title}" subscription?`}
          onClose={handleCloseModal}
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
            onClick={handleCloseModal}
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
        </DialogContentWrapper>
      </Slide>
    </Modal>
  );
};
