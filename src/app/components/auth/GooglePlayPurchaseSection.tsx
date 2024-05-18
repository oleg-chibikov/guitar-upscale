import { ApiCallResult, getPurchaseOnBackend } from "@/app/apiClient";
import { useDigitalGoodsServiceInfo } from "@/app/context/DigitalGoodsServiceInfoProvider";
import { AlertType } from "@/app/data/alertType";
import {
  GuitarUpscaleSpecificDigitalGoodsProductDetails,
  GuitarUpscaleSpecificPurchaseDetails,
} from "@/app/digitalGoodsBrowser";
import { buildDigitalGoodsService } from "@/app/helpers/serviceHelper";
import { useOnlineStatus } from "@/app/hooks/useOnlineStatus";
import { setAndShowAlert } from "@/app/store/uiSlice";
import { PurchaseData, PurchaseResponseData } from "@/lib/apiTypes";
import { CancelReason } from "@/lib/billing";
import { PurchaseParams } from "@/lib/purchaseParams";
import { Tier, tierMap } from "@/lib/tier";
import { Alert, LinearProgress } from "@mui/material";
import dynamic from "next/dynamic";
import { FC, useEffect, useState } from "react";
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

export type PurchasedOption = PurchaseData &
  PurchaseParams & {
    tier: Tier;
    isCancelled: boolean;
  };

export type PurchaseOption = {
  tier: Tier;
  details: GuitarUpscaleSpecificDigitalGoodsProductDetails;
  purchaseData?: PurchasedOption;
};

export const GooglePlayPurchaseSection: FC<GooglePlaySubscribeSectionProps> = ({
  onOptionSelected,
}) => {
  const dispatch = useDispatch();
  const [selectedOption, setSelectedOption] = useState<PurchaseOption>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const hasDigitalGoodsService = useDigitalGoodsServiceInfo();
  const [purchaseOptions, setPurchaseOptions] = useState<PurchaseOption[]>([]);
  const [allPurchasedOptions, setAllPurchasedOptions] = useState<
    PurchasedOption[]
  >([]);
  const [cancelSubscriptionModalOpen, setCancelSubscriptionModalOpen] =
    useState<boolean>(false);
  const [cancelSubscriptionModalOpened, setCancelSubscriptionModalOpened] =
    useState<boolean>(false);
  const [changeSubscriptionModalOpen, setChangeSubscriptionModalOpen] =
    useState<boolean>(false);
  const [changeSubscriptionModalOpened, setChangeSubscriptionModalOpened] =
    useState<boolean>(false);
  const [hasFailedOptions, setHasFailedOptions] = useState<boolean>(false);

  const isOnline = useOnlineStatus();

  const handleOpenCancelScubscriptionModal = () => {
    setCancelSubscriptionModalOpen(true);
    setCancelSubscriptionModalOpened(true); // only set this once to true to enable code splitting for the modal - it won't be loaded until this prop is true
  };

  const handleOpenChangeScubscriptionModal = () => {
    setChangeSubscriptionModalOpen(true);
    setChangeSubscriptionModalOpened(true); // only set this once to true to enable code splitting for the modal - it won't be loaded until this prop is true
  };

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
        const availablePurchaseOptions = (await digitalGoodsService.getDetails(
          Array.from(tierMap.keys())
        )) as GuitarUpscaleSpecificDigitalGoodsProductDetails[];

        const existingPurchases =
          (await digitalGoodsService.listPurchases()) as GuitarUpscaleSpecificPurchaseDetails[];
        const options = await Promise.all(
          availablePurchaseOptions.map(async (availablePurchaseOption) => {
            const tier = tierMap.get(availablePurchaseOption.itemId);
            const correspondingPurchasedItem = existingPurchases.find(
              (x) => x.itemId === availablePurchaseOption.itemId
            );
            let purchaseDataFromBackend: PurchaseResponseData | undefined;
            if (correspondingPurchasedItem) {
              const response = await getPurchaseOnBackend({
                itemId: availablePurchaseOption.itemId,
                purchaseToken: correspondingPurchasedItem.purchaseToken,
              });
              if (response.status === ApiCallResult.Success) {
                purchaseDataFromBackend = response.data;
              } else {
                dispatch(
                  setAndShowAlert({
                    message: `Cannot get details of "${tier}" due to an error`,
                    alertType: AlertType.Error,
                  })
                );

                setHasFailedOptions(true);
              }
            }

            const purchaseData = purchaseDataFromBackend?.data;

            const result = {
              details: availablePurchaseOption,
              purchaseData:
                purchaseData && correspondingPurchasedItem
                  ? ({
                      ...purchaseData,
                      ...correspondingPurchasedItem,
                      tier,
                      isCancelled:
                        purchaseData.cancellationReason &&
                        purchaseData.cancellationReason !== CancelReason.NONE,
                    } as PurchasedOption)
                  : undefined,
              tier: tier,
            } as PurchaseOption;

            console.log("Available purchase option", result);
            return result;
          })
        );

        setPurchaseOptions(options);
        setAllPurchasedOptions(
          options
            .filter((x) => x.purchaseData)
            .map((x) => x.purchaseData) as PurchasedOption[]
        );
      } catch (ex: unknown) {
        dispatch(
          setAndShowAlert({
            message: "Cannot get purchase options " + ex,
            alertType: AlertType.Error,
          })
        );
        setHasFailedOptions(true);
      } finally {
        setIsLoading(false);
      }
    };
    void getPurchaseOptions();
  }, [hasDigitalGoodsService, dispatch, isOnline]);

  if (hasFailedOptions) {
    // If there are any failures - better not to return any options - it may lead to a corrupted state
    return null;
  }

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
      {selectedOption && cancelSubscriptionModalOpened && (
        <CancelSubscriptionModal
          openModal={cancelSubscriptionModalOpen}
          handleCloseModal={() => setCancelSubscriptionModalOpen(false)}
          setIsLoading={setIsLoading}
          purchaseOption={selectedOption}
          disabledMessage={disabledMessage}
          allPurchasedOptions={allPurchasedOptions}
        />
      )}
      {selectedOption && changeSubscriptionModalOpened && (
        <ChangeSubscriptionModal
          openModal={changeSubscriptionModalOpen}
          handleCloseModal={() => setChangeSubscriptionModalOpen(false)}
          setIsLoading={setIsLoading}
          purchaseOption={selectedOption}
          disabledMessage={disabledMessage}
          allPurchasedOptions={allPurchasedOptions}
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
            allPurchasedOptions={allPurchasedOptions}
            showCancellationModal={() => {
              setSelectedOption(purchaseOption);
              handleOpenCancelScubscriptionModal();
            }}
            showChangeSubscriptionModal={() => {
              setSelectedOption(purchaseOption);
              handleOpenChangeScubscriptionModal();
            }}
            disabledMessage={disabledMessage}
            isSelected={selectedOption === purchaseOption}
            onClick={() => {
              if (purchaseOption === selectedOption) {
                setSelectedOption(undefined);
                onOptionSelected(undefined);
              } else {
                setSelectedOption(purchaseOption);
                onOptionSelected(purchaseOption.tier);
              }
            }}
            key={purchaseOption.details.itemId}
            purchaseOption={purchaseOption}
            setIsLoading={setIsLoading}
          />
        ))}
      </ul>
    </>
  );
};
