import { acknowldegeSubscriptionOnBackend } from "@/app/apiClient";
import { useDigitalGoodsService } from "@/app/context/DIgitalGoodsServiceProvider";
import { AlertType } from "@/app/data/alertType";
import { setAndShowAlert } from "@/app/store/uiSlice";
import { FC, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { GooglePlaySubscriptionOptionButton } from "./GooglePlaySubscriptionOptionButton";

const subscriptionItemIds = [
  "guitar_upscale.composer",
  "guitar_upscale.explorer",
];

interface GooglePlaySubscribeSectionProps {}

export const GooglePlaySubscribeSection: FC<
  GooglePlaySubscribeSectionProps
> = ({}) => {
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
          subscriptionItemIds
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

  // TODO: This should be done in a Root context in order to set the right permissions straight away
  const listPurchases = async (service: DigitalGoodsService) => {
    const existingPurchases = await service.listPurchases();
    for (const p of existingPurchases) {
      const data = await acknowldegeSubscriptionOnBackend({ ...p });
      if (data.error) {
        dispatch(
          setAndShowAlert({ message: data.error, alertType: AlertType.Error })
        );
        return;
      } else {
        console.log(`Users has entitlement for ${p.itemId}`);
        // TODO: WE NEED TO GET SUBSCRIPTION STATUS ON BACKEND WITHOUT STORING THE USER. BUT HOW TO DO THAT AS DigitalGoodsService is only available on frontend?
      }
      // Update the UI with items the user is already entitled to.
      console.log(`Users has entitlement for ${p.itemId}`);
    }
  };

  return (
    <ul className="flex flex-col gap-2">
      {subscriptionOptions.map((subscriptionOption) => (
        <GooglePlaySubscriptionOptionButton
          isSelected={selectedOption === subscriptionOption}
          onClick={(subscriptionOption) => {
            setSelectedOption(subscriptionOption);
          }}
          key={subscriptionOption.itemId}
          subscriptionOption={subscriptionOption}
        />
      ))}
    </ul>
  );
};
