"use client";

import { PremiumFeaturesWithSession } from "@/lib/subscription";
import { ThemeProvider, createTheme } from "@mui/material";
import { SessionProvider } from "next-auth/react";
import { FC, ReactNode } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistor, store } from "../store/store";
import { PremiumFeaturesProvider } from "./PremiumFeaturesContext";

interface PremiumFeaturesContextProviderProps {
  children: ReactNode;
  premiumFeaturesWithSession: PremiumFeaturesWithSession;
}

const theme = createTheme({
  palette: {
    primary: {
      main: "#E6B39A",
      light: "#E6B39A",
      dark: "#b3cde4",
      contrastText: "#2E1F1B",
    },
    secondary: {
      main: "#1976d2",
      light: "#42a5f5",
      dark: "#1565c0",
      contrastText: "#F2F2F2",
    },
  },
});

export const ContextProvider: FC<PremiumFeaturesContextProviderProps> = ({
  children,
  premiumFeaturesWithSession,
}) => {
  return (
    <SessionProvider session={premiumFeaturesWithSession.session}>
      <ThemeProvider theme={theme}>
        <Provider store={store}>
          <PremiumFeaturesProvider
            premiumFeatures={premiumFeaturesWithSession.premiumFeatures}
          >
            <PersistGate loading={null} persistor={persistor}>
              {children}
            </PersistGate>
          </PremiumFeaturesProvider>
        </Provider>
      </ThemeProvider>
    </SessionProvider>
  );
};
