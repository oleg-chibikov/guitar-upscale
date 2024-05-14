import { useDigitalGoodsService } from "@/app/context/DIgitalGoodsServiceProvider";
import { AlertType } from "@/app/data/alertType";
import { buildDigitalGoodsService } from "@/app/helpers/serviceHelper";
import { selectAuth } from "@/app/store/authSlice";
import { setAndShowAlert } from "@/app/store/uiSlice";
import { Tier, TierKey, tierMap } from "@/lib/tiers";
import { LinearProgress } from "@mui/material";
import { FC, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { GooglePlaySubscriptionOptionButton } from "./GooglePlaySubscriptionOptionButton";

interface GooglePlaySubscribeSectionProps {
  onOptionSelected: (option?: Tier) => void;
}

export const GooglePlaySubscribeSection: FC<
  GooglePlaySubscribeSectionProps
> = ({ onOptionSelected }) => {
  const dispatch = useDispatch();
  const [selectedOption, setSelectedOption] =
    useState<DigitalGoodsProductDetails>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const hasDigitalGoodsService = useDigitalGoodsService();
  const [subscriptionOptions, setSubscriptionOptions] = useState<
    DigitalGoodsProductDetails[]
  >([]);
  const { subscriptionTier } = useSelector(selectAuth);

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
        setSubscriptionOptions(details);
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

  return (
    <ul className="flex flex-col gap-2">
      {subscriptionOptions.map((subscriptionOption) => (
        <GooglePlaySubscriptionOptionButton
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
          isAlreadyPurchased={
            tierMap.get(subscriptionOption.itemId as TierKey) ===
            subscriptionTier?.tier
          }
        />
      ))}
    </ul>
  );
};
