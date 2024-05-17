"use client";

import { WithPremiumFeaturesWithSession } from "@/app/helpers/WithPremiumFeatures";
import { WithChildren } from "@/app/helpers/withChildren";
import { persistor, store } from "@/app/store/store";
import { SessionProvider } from "next-auth/react";
import { FC } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { DigitalGoodsServiceInfoProvider } from "./DigitalGoodsServiceInfoProvider";
import { MuiThemeProvider } from "./MuiThemeProvider";
import { PremiumFeaturesProvider } from "./PremiumFeaturesProvider";

type PremiumFeaturesContextProviderProps = WithChildren &
  WithPremiumFeaturesWithSession;

export const ContextProvider: FC<PremiumFeaturesContextProviderProps> = ({
  children,
  premiumFeatures,
}) => {
  return (
    <SessionProvider session={premiumFeatures.session}>
      <Provider store={store}>
        <MuiThemeProvider>
          <DigitalGoodsServiceInfoProvider>
            <PremiumFeaturesProvider premiumFeatures={premiumFeatures}>
              <PersistGate loading={null} persistor={persistor}>
                {children}
              </PersistGate>
            </PremiumFeaturesProvider>
          </DigitalGoodsServiceInfoProvider>
        </MuiThemeProvider>
      </Provider>
    </SessionProvider>
  );
};
