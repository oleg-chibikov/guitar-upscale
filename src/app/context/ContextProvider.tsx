"use client";

import { isAuthEnabled } from "@/lib/featureFlags";
import dynamic from "next/dynamic";
import { FC } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { AppShell } from "../components/AppShell";
import { WithChildren } from "../helpers/withChildren";
import { WithPremiumFeaturesWithSession } from "../helpers/withPremiumFeatures";
import { persistor, store } from "../store/store";
import { DigitalGoodsServiceInfoProvider } from "./DigitalGoodsServiceInfoProvider";
import { MuiThemeProvider } from "./MuiThemeProvider";
import { PremiumFeaturesProvider } from "./PremiumFeaturesProvider";

// A separate chunk, so next-auth loads only when auth is on
const SessionProvider = dynamic(() =>
  import("next-auth/react").then((nextAuth) => nextAuth.SessionProvider),
);

type PremiumFeaturesContextProviderProps = WithChildren &
  WithPremiumFeaturesWithSession;

export const ContextProvider: FC<PremiumFeaturesContextProviderProps> = ({
  children,
  premiumFeatures,
}) => {
  const content = (
    <Provider store={store}>
      <MuiThemeProvider>
        <DigitalGoodsServiceInfoProvider>
          <PremiumFeaturesProvider premiumFeatures={premiumFeatures}>
            <PersistGate loading={<AppShell />} persistor={persistor}>
              {children}
            </PersistGate>
          </PremiumFeaturesProvider>
        </DigitalGoodsServiceInfoProvider>
      </MuiThemeProvider>
    </Provider>
  );

  return isAuthEnabled ? (
    <SessionProvider session={premiumFeatures.session}>
      {content}
    </SessionProvider>
  ) : (
    content
  );
};
