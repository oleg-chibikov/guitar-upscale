import { ApiCallResult, getPurchaseOnBackend } from "@/app/apiClient";
import { useDigitalGoodsServiceInfo } from "@/app/context/DigitalGoodsServiceInfoProvider";
import { AlertType } from "@/app/data/alertType";
import {
  GuitarUpscaleSpecificDigitalGoodsProductDetails,
  GuitarUpscaleSpecificPurchaseDetails,
} from "@/app/digitalGoodsBrowser";
import { getTitle } from "@/app/helpers/purchaseOptionHelper";
import { buildDigitalGoodsService } from "@/app/helpers/serviceHelper";
import { useOnlineStatus } from "@/app/hooks/useOnlineStatus";
import { setAndShowAlert } from "@/app/store/uiSlice";
import { PurchaseData, PurchaseResponseData } from "@/lib/apiTypes";
import { Tier, tierMap } from "@/lib/tier";
import { Alert, LinearProgress } from "@mui/material";
import dynamic from "next/dynamic";
import { FC, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { ChangeSubscriptionModal } from "./ChangeSubscriptionModal";
import { GooglePlayPurchaseOptionButton } from "./GooglePlayPurchaseOptionButton";

const CancelSubscriptionModal = dynamic(
  async () =>
    (await import("./CancelSubscriptionModal")).CancelSubscriptionModal
);

interface GooglePlaySubscribeSectionProps {
  onOptionSelected: (option?: Tier) => void;
}

export type PurchaseOption = GuitarUpscaleSpecificDigitalGoodsProductDetails & {
  purchaseToken?: string;
  purchaseData?: PurchaseData;
};

export const GooglePlayPurchaseSection: FC<GooglePlaySubscribeSectionProps> = ({
  onOptionSelected,
}) => {
  const dispatch = useDispatch();
  const [selectedOption, setSelectedOption] = useState<PurchaseOption>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const hasDigitalGoodsService = useDigitalGoodsServiceInfo();
  const [purchaseOptions, setPurchaseOptions] = useState<PurchaseOption[]>([]);
  const [cancelSubscriptionModalOpen, setCancelSubscriptionModalOpen] =
    useState<boolean>(false);
  const [cancelSubscriptionModalOpened, setCancelSubscriptionModalOpened] =
    useState<boolean>(false);
  const [changeSubscriptionModalOpen, setChangeSubscriptionModalOpen] =
    useState<boolean>(false);
  const [changeSubscriptionModalOpened, setChangeSubscriptionModalOpened] =
    useState<boolean>(false);
  const [subscriptionToCancel, setSubscriptionToCancel] =
    useState<PurchaseOption>();

  const [subscriptionsToChange, setSubscriptionsToChange] = useState<{
    new: PurchaseOption;
    old: PurchaseOption;
  }>();
  const isOnline = useOnlineStatus();

  const handleOpenCancelScubscriptionModal = () => {
    setCancelSubscriptionModalOpen(true);
    setCancelSubscriptionModalOpened(true); // only set this once to true to enable code splitting for the modal - it won't be loaded until this prop is true
  };

  const handleOpenChangeScubscriptionModal = () => {
    setChangeSubscriptionModalOpen(true);
    setChangeSubscriptionModalOpened(true); // only set this once to true to enable code splitting for the modal - it won't be loaded until this prop is true
  };

  const purchasedNonCancelledOptionRef =
    useRef<GuitarUpscaleSpecificDigitalGoodsProductDetails>();

  useEffect(() => {
    if (!hasDigitalGoodsService) {
      return;
    }

    const getPurchaseOptions = async () => {
      if (!isOnline) {
        return;
      }
      setIsLoading(true);
      try {
        const digitalGoodsService = await buildDigitalGoodsService();
        const details = (await digitalGoodsService.getDetails(
          Array.from(tierMap.keys())
        )) as GuitarUpscaleSpecificDigitalGoodsProductDetails[];

        const existingPurchases =
          (await digitalGoodsService.listPurchases()) as GuitarUpscaleSpecificPurchaseDetails[];
        const options = await Promise.all(
          details.map(async (purchaseOption) => {
            const correspondingPurchasedItem = existingPurchases.find(
              (x) => x.itemId === purchaseOption.itemId
            );
            let responseData: PurchaseResponseData | undefined;
            if (correspondingPurchasedItem) {
              const response = await getPurchaseOnBackend({
                itemId: purchaseOption.itemId,
                purchaseToken: correspondingPurchasedItem.purchaseToken,
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

            const data = responseData?.data;

            const result = {
              ...purchaseOption,
              purchaseData: data,
              purchaseToken: correspondingPurchasedItem?.purchaseToken,
            } as PurchaseOption;

            if (data && !data.cancellationReason) {
              console.log("Purchased not cancelled item", result);
              // at any time there should be only one not cancelled subscription. if there are more - it means something is not working as expected
              purchasedNonCancelledOptionRef.current = result;
            }

            return result;
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
  }, [hasDigitalGoodsService, dispatch, isOnline]);

  if (!hasDigitalGoodsService) {
    return null;
  }

  if (isLoading) {
    return <LinearProgress />;
  }

  const disabledMessage = !isOnline
    ? "Cannot purchase while offline"
    : undefined;

  return (
    <>
      {!isOnline && !purchaseOptions.length && (
        <Alert severity="warning">
          Google Play subscription options cannot be loaded while offline
        </Alert>
      )}
      {subscriptionToCancel && cancelSubscriptionModalOpened && (
        <CancelSubscriptionModal
          openModal={cancelSubscriptionModalOpen}
          handleCloseModal={() => setCancelSubscriptionModalOpen(false)}
          setIsLoading={setIsLoading}
          purchaseOption={subscriptionToCancel}
          disabledMessage={disabledMessage}
        />
      )}
      {subscriptionsToChange && changeSubscriptionModalOpened && (
        <ChangeSubscriptionModal
          openModal={changeSubscriptionModalOpen}
          handleCloseModal={() => setChangeSubscriptionModalOpen(false)}
          setIsLoading={setIsLoading}
          purchaseOption={subscriptionsToChange.new}
          existingNotCancelledPurchaseOption={subscriptionsToChange.old}
          disabledMessage={disabledMessage}
        />
      )}
      <ul
        className="grid gap-y-2 items-stretch"
        style={{
          gridTemplateColumns: "4fr 10fr 1fr 2fr 2fr",
        }}
      >
        {purchaseOptions.map((purchaseOption) => (
          <GooglePlayPurchaseOptionButton
            existingNotCancelledPurchaseOption={
              purchasedNonCancelledOptionRef.current
            }
            showCancellationModal={(option) => {
              setSubscriptionToCancel(option);
              handleOpenCancelScubscriptionModal();
            }}
            showChangeSubscriptionModal={(option, oldOption) => {
              setSubscriptionsToChange({ new: option, old: oldOption });
              handleOpenChangeScubscriptionModal();
            }}
            disabledMessage={disabledMessage}
            isSelected={selectedOption === purchaseOption}
            onClick={(purchaseOption) => {
              if (purchaseOption === selectedOption) {
                setSelectedOption(undefined);
                onOptionSelected(undefined);
              } else {
                setSelectedOption(purchaseOption);
                onOptionSelected(tierMap.get(purchaseOption.itemId));
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
