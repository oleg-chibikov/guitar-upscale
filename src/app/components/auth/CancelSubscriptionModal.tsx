import { ApiCallResult, cancelPurchaseOnBackend } from "@/app/apiClient";
import { useDigitalGoodsServiceInfo } from "@/app/context/DigitalGoodsServiceInfoProvider";
import { AlertType } from "@/app/data/alertType";
import { Theme } from "@/app/data/theme";
import { GuitarUpscaleSpecificPurchaseDetails } from "@/app/digitalGoodsBrowser";
import { getTitle } from "@/app/helpers/purchaseOptionHelper";
import { incrementAndReload } from "@/app/helpers/reloadHelper";
import { buildDigitalGoodsService } from "@/app/helpers/serviceHelper";
import { GOOGLE_PLAY_RELOAD_KEY } from "@/app/hooks/useGooglePlayAuth";
import { selectUi, setAndShowAlert } from "@/app/store/uiSlice";
import { CancellationMode } from "@/lib/apiTypes";
import { msToFormattedDate } from "@/lib/dateHelper";
import { Alert, Button, Modal, Slide } from "@mui/material";
import { FC } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CloseIcon } from "../CloseIcon";
import { ModalProps } from "../ModalProps";
import { PurchaseOption } from "./GooglePlayPurchaseSection";

export const CancelSubscriptionModal: FC<
  ModalProps & {
    setIsLoading: (isLoading: boolean) => void;
    purchaseOption: PurchaseOption;
    disabledMessage?: string;
  }
> = ({
  openModal,
  handleCloseModal,
  setIsLoading,
  purchaseOption,
  disabledMessage,
}) => {
  const { theme } = useSelector(selectUi);
  const dispatch = useDispatch();
  const hasDigitalGoodsService = useDigitalGoodsServiceInfo();
  const title = getTitle(purchaseOption);

  const cancelSubscription = async () => {
    if (!hasDigitalGoodsService) {
      return;
    }
    if (disabledMessage) {
      console.log(disabledMessage);
      return;
    }
    setIsLoading(true);
    try {
      const digitalGoodsService = await buildDigitalGoodsService();
      const existingPurchases =
        (await digitalGoodsService.listPurchases()) as GuitarUpscaleSpecificPurchaseDetails[];
      const purchases = existingPurchases
        .filter((x) => x.itemId === purchaseOption.itemId)
        .map((x) => ({
          itemId: x.itemId,
          purchaseToken: x.purchaseToken,
        }));
      if (!purchases.length) {
        dispatch(
          setAndShowAlert({
            message: `Cannot cancel the subscription "${title}". Google Play api doesn't list it as purchased`,
            alertType: AlertType.Error,
          })
        );
      }
      const cancelResult = await cancelPurchaseOnBackend(purchases[0]);
      if (cancelResult.status === ApiCallResult.Success) {
        const message = `Subscription "${title}" has been successfully cancelled`;
        dispatch(
          setAndShowAlert({
            message,
          })
        );
        await incrementAndReload(GOOGLE_PLAY_RELOAD_KEY, 0, dispatch, message);
      } else if (cancelResult.status === ApiCallResult.SkipProcessing) {
        dispatch(
          setAndShowAlert({
            message: `Subscription "${title}" is already cancelled`,
            alertType: AlertType.Warning,
          })
        );
      } else {
        dispatch(
          setAndShowAlert({
            message: `Cannot cancel the subscription "${title}" due to an error`,
            alertType: AlertType.Error,
          })
        );
      }
    } catch (e) {
      console.log(e);
      dispatch(
        setAndShowAlert({
          message: "Cancellation aborted",
          alertType: AlertType.Warning,
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const purchaseData = purchaseOption.purchaseData;
  const expirationDate = msToFormattedDate(purchaseData?.expirationDateMs);
  const subscribedDate = msToFormattedDate(purchaseData?.subscribedDateMs);
  const expirationDateText = expirationDate ? ` ${expirationDate}` : "";
  const subscribedDateText = subscribedDate ? ` (${subscribedDate})` : "";
  const cancellationMode = purchaseData?.cancellationMode;

  return (
    <Modal
      slotProps={{
        backdrop: { style: { backgroundColor: "rgba(0,0,0,0.8)" } },
      }}
      open={openModal}
      onClose={handleCloseModal}
      aria-labelledby="cancel-subscription-modal"
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
          <div>{`Are you sure you would like to cancel your "${title}" subscription?`}</div>
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
        </section>
      </Slide>
    </Modal>
  );
};
