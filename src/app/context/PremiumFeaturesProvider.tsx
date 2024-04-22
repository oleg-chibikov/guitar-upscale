"use client";
import { PremiumFeatures } from "@/lib/subscription";
import React, { createContext, useContext, useEffect } from "react";
import { useDispatch } from "react-redux";
import { WithChildren } from "../helpers/withChildren";
import { setSubscriptionTier } from "../store/settingsSlice";

// Create a context for PremiumFeatures
const PremiumFeaturesContext = createContext<PremiumFeatures>({});

// Create a custom hook to access PremiumFeatures
export const usePremiumFeatures = () => {
  const context = useContext(PremiumFeaturesContext);
  if (!context) {
    return {};
  }
  return context;
};

// Create a provider component to wrap your app with PremiumFeatures
export const PremiumFeaturesProvider: React.FC<
  WithChildren & { premiumFeatures: PremiumFeatures }
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
