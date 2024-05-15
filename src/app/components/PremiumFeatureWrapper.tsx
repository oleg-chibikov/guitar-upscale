import { FC } from "react";
import { WithChildren } from "../helpers/withChildren";
import { PremiumFeaturesWithSession, getPremiumFeatures } from "@/lib/premiumFeatures";

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
