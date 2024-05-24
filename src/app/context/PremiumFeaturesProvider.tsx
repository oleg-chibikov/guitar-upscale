"use client";

import {
  PremiumFeatures,
  PremiumFeaturesWithSession,
} from "@/lib/premiumFeatures";
import React, { createContext, useContext, useEffect } from "react";
import { useDispatch } from "react-redux";
import { WithChildren } from "../helpers/withChildren";
import { setSubscriptionTier } from "../store/authSlice";

// Create a context for PremiumFeatures
const PremiumFeaturesContext = createContext<{
  premiumFeatures: PremiumFeatures;
  composerPremiumFeatures: PremiumFeatures;
  explorerPremiumFeatures: PremiumFeatures;
}>({
  premiumFeatures: {},
  composerPremiumFeatures: {},
  explorerPremiumFeatures: {},
});

// Create a custom hook to access PremiumFeatures
export const usePremiumFeatures = () => {
  const context = useContext(PremiumFeaturesContext);
  if (context === undefined) {
    return {
      premiumFeatures: {},
      composerPremiumFeatures: {},
      explorerPremiumFeatures: {},
    };
  }
  return context;
};

// Create a provider component to wrap your app with PremiumFeatures
export const PremiumFeaturesProvider: React.FC<
  WithChildren & { premiumFeatures: PremiumFeaturesWithSession }
> = ({ premiumFeatures, children }) => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(setSubscriptionTier(premiumFeatures.subscriptionTier));
  }, [dispatch, premiumFeatures.subscriptionTier]);

  return (
    <PremiumFeaturesContext.Provider value={premiumFeatures}>
      {children}
    </PremiumFeaturesContext.Provider>
  );
};
