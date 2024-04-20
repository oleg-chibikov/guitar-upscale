import {
  PremiumFeaturesWithSession,
  getPremiumFeatures,
} from "@/lib/subscription";
import { FC } from "react";
import { WithChildren } from "../helpers/withChildren";

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
