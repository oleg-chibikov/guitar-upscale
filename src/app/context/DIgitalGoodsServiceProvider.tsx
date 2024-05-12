"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { WithChildren } from "../helpers/withChildren";
import { setAndShowAlert } from "../store/uiSlice";

// Create a context for DigitalGoodsService
const DigitalGoodsServiceContext = createContext<
  DigitalGoodsService | undefined
>(undefined);

// Create a custom hook to access DigitalGoodsService
export const useDigitalGoodsService = () => {
  return useContext(DigitalGoodsServiceContext);
};

// Create a provider component to wrap your app with DigitalGoodsService
export const DigitalGoodsServiceProvider: React.FC<WithChildren> = ({
  children,
}) => {
  const [service, setService] = useState<DigitalGoodsService>();
  const dispatch = useDispatch();
  useEffect(() => {
    const checkAndSetService = async () => {
      if ("getDigitalGoodsService" in window) {
        const getDigitalGoodsService = window.getDigitalGoodsService;
        // Digital Goods API is supported!
        let service: DigitalGoodsService;
        try {
          service = await getDigitalGoodsService(
            "https://play.google.com/billing"
          );
          setService(service);
          setAndShowAlert({
            message: "Got service DigitalGoodsService" + service,
            isError: false,
          });
          // Google Play Billing is supported!
        } catch (error) {
          dispatch(
            setAndShowAlert({
              message: "Cannot get DigitalGoodsService",
              isError: true,
            })
          );
          console.error("Cannot get DigitalGoodsService");
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
