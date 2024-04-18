import { PremiumFeatures } from "@/lib/subscription";
import React, { ReactNode, createContext, useContext } from "react";

// Create a context for PremiumFeatures
const PremiumFeaturesContext = createContext<PremiumFeatures | undefined>(
  undefined
);

// Create a custom hook to access PremiumFeatures
export const usePremiumFeatures = () => {
  const context = useContext(PremiumFeaturesContext);
  if (!context) {
    return undefined;
  }
  return context;
};

// Create a provider component to wrap your app with PremiumFeatures
export const PremiumFeaturesProvider: React.FC<{
  premiumFeatures: PremiumFeatures | undefined;
  children: ReactNode;
}> = ({ premiumFeatures, children }) => {
  return (
    <PremiumFeaturesContext.Provider value={premiumFeatures}>
      {children}
    </PremiumFeaturesContext.Provider>
  );
};
