import { useDigitalGoodsServiceInfo } from "@/app/context/DigitalGoodsServiceInfoProvider";
import { Theme } from "@/app/data/theme";
import {
  GetMakePurchaseParams,
  getMakePurchase,
} from "@/app/helpers/getMakePurchase";
import { getChangeAction, getTitle } from "@/app/helpers/purchaseOptionHelper";
import { selectUi } from "@/app/store/uiSlice";
import { CancellationMode } from "@/lib/apiTypes";
import { msToFormattedDate } from "@/lib/dateHelper";
import { Alert, Button, Modal, Slide } from "@mui/material";
import { FC } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CloseIcon } from "../CloseIcon";
import { ModalProps } from "../ModalProps";

export const ChangeSubscriptionModal: FC<ModalProps & GetMakePurchaseParams> = (
  params
) => {
  const {
    openModal,
    handleCloseModal,
    purchaseOption,
    disabledMessage,
    existingNotCancelledPurchaseOption,
  } = params;
  const { theme } = useSelector(selectUi);
  const dispatch = useDispatch();
  const hasDigitalGoodsService = useDigitalGoodsServiceInfo();

  if (!existingNotCancelledPurchaseOption) {
    return null;
  }

  const makePurchase = getMakePurchase(
    params,
    hasDigitalGoodsService,
    dispatch
  );

  const existingSubscriptionPurchaseData =
    existingNotCancelledPurchaseOption.purchaseData;
  const existingSubscriptionExpirationDate = msToFormattedDate(
    existingSubscriptionPurchaseData?.expirationDateMs
  );
  const existingSubscriptionSubscribedDate = msToFormattedDate(
    existingSubscriptionPurchaseData?.subscribedDateMs
  );
  const existingSubscriptionExpirationDateText =
    existingSubscriptionExpirationDate
      ? ` ${existingSubscriptionExpirationDate}`
      : "";
  const existingSubscriptionSubscribedDateText =
    existingSubscriptionSubscribedDate
      ? ` (${existingSubscriptionSubscribedDate})`
      : "";

  const changeAction = getChangeAction(existingNotCancelledPurchaseOption)!;
  const existingSubscriptionCancellationMode =
    existingNotCancelledPurchaseOption.purchaseData?.cancellationMode;

  const existingSubscriptionTitle = getTitle(
    existingNotCancelledPurchaseOption
  );
  const newSubscriptionTitle = getTitle(purchaseOption);

  return (
    <Modal
      slotProps={{
        backdrop: { style: { backgroundColor: "rgba(0,0,0,0.8)" } },
      }}
      open={openModal}
      onClose={handleCloseModal}
      aria-labelledby="change-subscription-modal"
    >
      <Slide direction="down" in={openModal} mountOnEnter unmountOnExit>
        <section
          className={`relative flex overflow-auto max-h-full justify-center text-center items-stretch flex-col gap-2 border-2 p-2 ${
            theme === Theme.Light
              ? "bg-accented_background-light border-border-light text-foreground-light"
              : "bg-accented_background-dark  border-border-dark text-foreground-dark"
          }`}
        >
          <CloseIcon onPress={handleCloseModal} />
          <div>{`Are you sure you would like to ${changeAction.toLocaleLowerCase()} your "${getTitle(
            existingNotCancelledPurchaseOption
          )}" subscription?`}</div>

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
        </section>
      </Slide>
    </Modal>
  );
};
