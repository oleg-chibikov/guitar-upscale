"use client";
import { WithChildren } from "@/app/helpers/withChildren";
import React, { createContext, useContext, useEffect, useState } from "react";

// Create a context for DigitalGoodsService
const DigitalGoodsServiceContext = createContext<boolean>(false);

// Create a custom hook to access DigitalGoodsService
export const useDigitalGoodsServiceInfo = () => {
  return useContext(DigitalGoodsServiceContext);
};

// Create a provider component to wrap your app with DigitalGoodsService
export const DigitalGoodsServiceInfoProvider: React.FC<WithChildren> = ({
  children,
}) => {
  const [hasService, setHasService] = useState<boolean>(false);
  useEffect(() => {
    setHasService("getDigitalGoodsService" in window);
  }, []);

  return (
    <DigitalGoodsServiceContext.Provider value={hasService}>
      {children}
    </DigitalGoodsServiceContext.Provider>
  );
};
