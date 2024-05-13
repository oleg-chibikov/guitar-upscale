import { useDigitalGoodsService } from "@/app/context/DIgitalGoodsServiceProvider";
import { AlertType } from "@/app/data/alertType";
import { setAndShowAlert } from "@/app/store/uiSlice";
import { Tier } from "@/lib/tiers";
import { FC, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { GooglePlaySubscriptionOptionButton } from "./GooglePlaySubscriptionOptionButton";

const tierMap = new Map<string, Tier>([
  ["guitar_upscale.composer", "Composer"],
  ["guitar_upscale.explorer", "Explorer"],
]);

interface GooglePlaySubscribeSectionProps {
  onOptionSelected: (option: Tier) => void;
}

export const GooglePlaySubscribeSection: FC<
  GooglePlaySubscribeSectionProps
> = ({ onOptionSelected }) => {
  const dispatch = useDispatch();
  const [selectedOption, setSelectedOption] =
    useState<DigitalGoodsProductDetails>();
  const hasDigitalGoodsService = useDigitalGoodsService();
  const [subscriptionOptions, setSubscriptionOptions] = useState<
    DigitalGoodsProductDetails[]
  >([]);

  useEffect(() => {
    if (!hasDigitalGoodsService) {
      return;
    }

    const getSubscriptionOptions = async () => {
      try {
        const getDigitalGoodsService = window.getDigitalGoodsService;
        const digitalGoodsService = await getDigitalGoodsService(
          "https://play.google.com/billing"
        );
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
      }
    };
    getSubscriptionOptions();
  }, [hasDigitalGoodsService, dispatch]);

  if (!hasDigitalGoodsService) {
    return null;
  }

  return (
    <ul className="flex flex-col gap-2">
      {subscriptionOptions.map((subscriptionOption) => (
        <GooglePlaySubscriptionOptionButton
          isSelected={selectedOption === subscriptionOption}
          onClick={(subscriptionOption) => {
            setSelectedOption(subscriptionOption);
            onOptionSelected(tierMap.get(subscriptionOption.itemId)!);
          }}
          key={subscriptionOption.itemId}
          subscriptionOption={subscriptionOption}
        />
      ))}
    </ul>
  );
};
