"use client";

import { PremiumFeaturesWithSession } from "@/lib/subscription";
import { SessionProvider } from "next-auth/react";
import { FC, ReactNode } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistor, store } from "../store/store";
import { MuiThemeProvider } from "./MuiThemeProvider";
import { PremiumFeaturesProvider } from "./PremiumFeaturesContext";

interface PremiumFeaturesContextProviderProps {
  children: ReactNode;
  premiumFeaturesWithSession: PremiumFeaturesWithSession;
}

export const ContextProvider: FC<PremiumFeaturesContextProviderProps> = ({
  children,
  premiumFeaturesWithSession,
}) => {
  return (
    <SessionProvider session={premiumFeaturesWithSession.session}>
      <Provider store={store}>
        <MuiThemeProvider>
          <PremiumFeaturesProvider
            premiumFeatures={premiumFeaturesWithSession.premiumFeatures}
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
