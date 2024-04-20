"use client";

import { SessionProvider } from "next-auth/react";
import { FC } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { WithPremiumFeatures } from "../helpers/WithPremiumFeatures";
import { WithChildren } from "../helpers/withChildren";
import { persistor, store } from "../store/store";
import { MuiThemeProvider } from "./MuiThemeProvider";
import { PremiumFeaturesProvider } from "./PremiumFeaturesContext";

type PremiumFeaturesContextProviderProps = WithChildren & WithPremiumFeatures;

export const ContextProvider: FC<PremiumFeaturesContextProviderProps> = ({
  children,
  premiumFeatures,
}) => {
  return (
    <SessionProvider session={premiumFeatures.session}>
      <Provider store={store}>
        <MuiThemeProvider>
          <PremiumFeaturesProvider
            premiumFeatures={premiumFeatures.premiumFeatures}
          >
            <PersistGate loading={null} persistor={persistor}>
              {children}
            </PersistGate>
          </PremiumFeaturesProvider>
        </MuiThemeProvider>
      </Provider>
    </SessionProvider>
  );
};
