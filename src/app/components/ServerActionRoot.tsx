import "server-only";

import {
  PremiumFeaturesWithSession,
  getPremiumFeatures,
} from "@/lib/subscription";
import React, { ReactElement } from "react";

const ServerActionRoot: React.FC<{
  renderChildren: (
    premiumFeaturesWithSession: PremiumFeaturesWithSession
  ) => ReactElement;
}> = async ({ renderChildren }) => {
  const premiumFeaturesWithSession = await getPremiumFeatures();

  return <>{renderChildren(premiumFeaturesWithSession)}</>;
};

export default ServerActionRoot;
