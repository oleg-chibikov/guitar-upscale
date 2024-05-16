import { ApiCallResult, getPurchaseOnBackend } from "@/app/apiClient";
import { useDigitalGoodsService } from "@/app/context/DIgitalGoodsServiceProvider";
import { AlertType } from "@/app/data/alertType";
import { getTitle } from "@/app/helpers/purchaseOptionHelper";
import { buildDigitalGoodsService } from "@/app/helpers/serviceHelper";
import { useOnlineStatus } from "@/app/hooks/useOnlineStatus";
import { setAndShowAlert } from "@/app/store/uiSlice";
import { CancellationMode, PurchaseResponseData } from "@/lib/apiTypes";
import { CancelReason } from "@/lib/billing";
import { Tier, TierKey, tierMap } from "@/lib/tier";
import { LinearProgress } from "@mui/material";
import dynamic from "next/dynamic";
import { FC, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { GooglePlayPurchaseOptionButton } from "./GooglePlayPurchaseOptionButton";

const CancelPurchaseModal = dynamic(
  async () => (await import("./CancelPurchaseModal")).CancelPurchaseModal
);

interface GooglePlaySubscribeSectionProps {
  onOptionSelected: (option?: Tier) => void;
}

export type PurchaseInfo = DigitalGoodsProductDetails & {
  purchaseToken?: string;
  isCancelled: boolean;
  cancellationMode?: CancellationMode;
};

export const GooglePlaySubscribeSection: FC<
  GooglePlaySubscribeSectionProps
> = ({ onOptionSelected }) => {
  const dispatch = useDispatch();
  const [selectedOption, setSelectedOption] = useState<PurchaseInfo>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const hasDigitalGoodsService = useDigitalGoodsService();
  const [purchaseOptions, setPurchaseOptions] = useState<PurchaseInfo[]>([]);
  const [cancelSubscriptionModalOpen, setSubscriptionModalOpen] =
    useState<boolean>(false);
  const [cancelSubscriptionModalOpened, setSubscriptionModalOpened] =
    useState<boolean>(false);
  const [subscriptionToCancel, setSubscriptionToCancel] =
    useState<PurchaseInfo>();
  const online = useOnlineStatus();

  const handleOpenModal = () => {
    setSubscriptionModalOpen(true);
    setSubscriptionModalOpened(true); // only set this once to true to enable code splitting for the modal - it won't be loaded until this prop is true
  };

  useEffect(() => {
    if (!hasDigitalGoodsService) {
      return;
    }

    const getPurchaseOptions = async () => {
      setIsLoading(true);
      try {
        const digitalGoodsService = await buildDigitalGoodsService();
        const details = await digitalGoodsService.getDetails(
          Array.from(tierMap.keys())
        );

        const existingPurchases = await digitalGoodsService.listPurchases();
        const options = await Promise.all(
          details.map(async (purchaseOption) => {
            const correspondingItem = existingPurchases.find(
              (x) => x.itemId === purchaseOption.itemId
            );
            let responseData: PurchaseResponseData | undefined;
            let cancellationReason = responseData?.cancellationReason;
            if (correspondingItem) {
              const response = await getPurchaseOnBackend({
                itemId: purchaseOption.itemId as TierKey,
                purchaseToken: correspondingItem.purchaseToken,
              });
              if (response.status === ApiCallResult.Success) {
                responseData = response.data;
              } else {
                const title = getTitle(purchaseOption);
                dispatch(
                  setAndShowAlert({
                    message: `Cannot get details of "${title}" due to an error`,
                    alertType: AlertType.Error,
                  })
                );
              }
            }
            const isCancelled =
              cancellationReason !== undefined
                ? cancellationReason !== CancelReason.NONE
                : false;

            console.log(isCancelled);
            return {
              ...purchaseOption,
              cancellationMode: responseData?.cancellationMode,
              purchaseToken: correspondingItem?.purchaseToken,
              isCancelled,
            } as PurchaseInfo;
          })
        );

        setPurchaseOptions(options);
      } catch (ex: any) {
        dispatch(
          setAndShowAlert({
            message: "Cannot get purchase options " + ex,
            alertType: AlertType.Error,
          })
        );
      } finally {
        setIsLoading(false);
      }
    };
    getPurchaseOptions();
  }, [hasDigitalGoodsService, dispatch]);

  if (!hasDigitalGoodsService) {
    return null;
  }

  if (isLoading) {
    return <LinearProgress />;
  }

  const disabledMessage = !online ? "Cannot purchase while offline" : undefined;

  return (
    <>
      {subscriptionToCancel && cancelSubscriptionModalOpened && (
        <CancelPurchaseModal
          openModal={cancelSubscriptionModalOpen}
          handleCloseModal={() => setSubscriptionModalOpen(false)}
          setIsLoading={setIsLoading}
          purchaseOption={subscriptionToCancel}
          disabledMessage={disabledMessage}
        />
      )}
      <ul
        className="grid gap-y-2 items-stretch"
        style={{
          gridTemplateColumns: "1fr 7fr 1fr 2fr 2fr",
        }}
      >
        {purchaseOptions.map((purchaseOption) => (
          <GooglePlayPurchaseOptionButton
            showCancellationModal={(option) => {
              setSubscriptionToCancel(option);
              handleOpenModal();
            }}
            disabledMessage={disabledMessage}
            isSelected={selectedOption === purchaseOption}
            onClick={(purchaseOption) => {
              if (purchaseOption === selectedOption) {
                setSelectedOption(undefined);
                onOptionSelected(undefined);
              } else {
                setSelectedOption(purchaseOption);
                onOptionSelected(tierMap.get(purchaseOption.itemId as TierKey));
              }
            }}
            key={purchaseOption.itemId}
            purchaseOption={purchaseOption}
            setIsLoading={setIsLoading}
          />
        ))}
      </ul>
    </>
  );
};
