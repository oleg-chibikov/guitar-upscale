import { getSubscriptionCancellationReasonOnBackend } from "@/app/apiClient";
import { useDigitalGoodsService } from "@/app/context/DIgitalGoodsServiceProvider";
import { AlertType } from "@/app/data/alertType";
import { buildDigitalGoodsService } from "@/app/helpers/serviceHelper";
import { useOnlineStatus } from "@/app/hooks/useOnlineStatus";
import { setAndShowAlert } from "@/app/store/uiSlice";
import { Tier, TierKey, tierMap } from "@/lib/tier";
import { LinearProgress } from "@mui/material";
import dynamic from "next/dynamic";
import { FC, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { GooglePlaySubscriptionOptionButton } from "./GooglePlaySubscriptionOptionButton";

const CancelSubscriptionModal = dynamic(
  async () =>
    (await import("./CancelSubscriptionModal")).CancelSubscriptionModal
);

interface GooglePlaySubscribeSectionProps {
  onOptionSelected: (option?: Tier) => void;
}

export type SubscriptionInfo = DigitalGoodsProductDetails & {
  purchaseToken?: string;
  isCancelled: boolean;
};

export const GooglePlaySubscribeSection: FC<
  GooglePlaySubscribeSectionProps
> = ({ onOptionSelected }) => {
  const dispatch = useDispatch();
  const [selectedOption, setSelectedOption] = useState<SubscriptionInfo>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const hasDigitalGoodsService = useDigitalGoodsService();
  const [subscriptionOptions, setSubscriptionOptions] = useState<
    SubscriptionInfo[]
  >([]);
  const [cancelSubscriptionModalOpen, setSubscriptionModalOpen] =
    useState<boolean>(false);
  const [cancelSubscriptionModalOpened, setSubscriptionModalOpened] =
    useState<boolean>(false);
  const [subscriptionToCancel, setSubscriptionToCancel] =
    useState<SubscriptionInfo>();
  const online = useOnlineStatus();

  const handleOpenModal = () => {
    setSubscriptionModalOpen(true);
    setSubscriptionModalOpened(true); // only set this once to true to enable code splitting for the modal - it won't be loaded until this prop is true
  };

  useEffect(() => {
    if (!hasDigitalGoodsService) {
      return;
    }

    const getSubscriptionOptions = async () => {
      setIsLoading(true);
      try {
        const digitalGoodsService = await buildDigitalGoodsService();
        const details = await digitalGoodsService.getDetails(
          Array.from(tierMap.keys())
        );

        const existingPurchases = await digitalGoodsService.listPurchases();
        const options = await Promise.all(
          details.map(async (subscriptionOption) => {
            const correspondingItem = existingPurchases.find(
              (x) => x.itemId === subscriptionOption.itemId
            );
            const cancellationReason =
              await getSubscriptionCancellationReasonOnBackend();
            return {
              ...subscriptionOption,
              purchaseToken: correspondingItem?.purchaseToken,
              isCancelled: cancellationReason !== undefined,
            };
          })
        );

        setSubscriptionOptions(options);
      } catch (ex: any) {
        dispatch(
          setAndShowAlert({
            message: "Cannot get supscription options " + ex,
            alertType: AlertType.Error,
          })
        );
      } finally {
        setIsLoading(false);
      }
    };
    getSubscriptionOptions();
  }, [hasDigitalGoodsService, dispatch]);

  if (!hasDigitalGoodsService) {
    return null;
  }

  if (isLoading) {
    return <LinearProgress />;
  }

  const disabledMessage = !online
    ? "Cannot subscribe/unsubscribe while offline"
    : undefined;

  return (
    <>
      {subscriptionToCancel && cancelSubscriptionModalOpened && (
        <CancelSubscriptionModal
          openModal={cancelSubscriptionModalOpen}
          handleCloseModal={() => setSubscriptionModalOpen(false)}
          setIsLoading={setIsLoading}
          subscriptionOption={subscriptionToCancel}
          disabledMessage={disabledMessage}
        />
      )}
      <ul
        className="grid gap-y-2 items-stretch"
        style={{
          gridTemplateColumns: "1fr 5fr 1fr 2fr 2fr",
          gridTemplateRows: "auto auto",
        }}
      >
        {subscriptionOptions.map((subscriptionOption) => (
          <GooglePlaySubscriptionOptionButton
            showCancellationModal={(option) => {
              setSubscriptionToCancel(option);
              handleOpenModal();
            }}
            disabledMessage={disabledMessage}
            isSelected={selectedOption === subscriptionOption}
            onClick={(subscriptionOption) => {
              if (subscriptionOption === selectedOption) {
                setSelectedOption(undefined);
                onOptionSelected(undefined);
              } else {
                setSelectedOption(subscriptionOption);
                onOptionSelected(
                  tierMap.get(subscriptionOption.itemId as TierKey)
                );
              }
            }}
            key={subscriptionOption.itemId}
            subscriptionOption={subscriptionOption}
            setIsLoading={setIsLoading}
          />
        ))}
      </ul>
    </>
  );
};
