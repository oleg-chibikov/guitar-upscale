import { WithChildren } from "@/app/helpers/withChildren";
import {
  PremiumFeaturesWithSession,
  getPremiumFeatures,
} from "@/lib/premiumFeatures";
import { FC } from "react";

interface PremiumFeatureWrapperProps extends WithChildren {
  shouldRender: (
    premiumFeaturesWithSession: PremiumFeaturesWithSession
  ) => boolean;
}

export const PremiumFeatureWrapper: FC<PremiumFeatureWrapperProps> = async ({
  children,
  shouldRender,
}) => {
  const premiumFeaturesWithSession = await getPremiumFeatures();
  if (shouldRender(premiumFeaturesWithSession)) {
    return <div>{children}</div>;
  }
  return null;
};
