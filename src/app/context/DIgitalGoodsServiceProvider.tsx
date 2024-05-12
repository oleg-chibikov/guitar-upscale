"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { WithChildren } from "../helpers/withChildren";

// Create a context for DigitalGoodsService
const DigitalGoodsServiceContext = createContext<
  DigitalGoodsService | undefined
>(undefined);

// Create a custom hook to access DigitalGoodsService
export const useDigitalGoodsService = () => {
  const context = useContext(DigitalGoodsServiceContext);
  if (!context) {
    return undefined;
  }
  return context;
};

// Create a provider component to wrap your app with DigitalGoodsService
export const DigitalGoodsServiceProvider: React.FC<WithChildren> = ({
  children,
}) => {
  const [service, setService] = useState<DigitalGoodsService>();
  useEffect(() => {
    const checkAndSetService = async () => {
      alert("Service: " + ("getDigitalGoodsService" in window));
      if ("getDigitalGoodsService" in window) {
        const getDigitalGoodsService = window.getDigitalGoodsService;
        // Digital Goods API is supported!
        let service: DigitalGoodsService;
        try {
          service = await getDigitalGoodsService(
            "https://play.google.com/billing"
          );
          setService(service);
          // Google Play Billing is supported!
        } catch (error) {
          console.error("Cannot get DigitalGoodsService not available");
        }
      } else {
        console.log("DigitalGoodsService not available in the current context");
      }
    };

    checkAndSetService();
  }, []);
  return (
    <DigitalGoodsServiceContext.Provider value={service}>
      {children}
    </DigitalGoodsServiceContext.Provider>
  );
};
