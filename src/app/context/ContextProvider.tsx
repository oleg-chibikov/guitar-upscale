"use client";

import { SessionProvider } from "next-auth/react";
import { FC } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { WithPremiumFeaturesWithSession } from "../helpers/WithPremiumFeatures";
import { WithChildren } from "../helpers/withChildren";
import { persistor, store } from "../store/store";
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
