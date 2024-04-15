import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Platform, View } from "react-native";
import { Main } from "./components/Main";
import { tw } from "./tailwind";

import { registerRootComponent } from "expo";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Provider as TootlipProvider } from "react-native-paper";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistor, store } from "./store/store";

export default function App() {
  useEffect(() => {
    // Orientation.lockToLandscape(); // this will lock the view to Landscape

    if (Platform.OS === "web") {
      // prevent the Google translate bottom popup from appearing on mobile screen
      document.addEventListener(
        "click",
        function (event: any) {
          if (event.target.nodeName === "SPAN") {
            event.preventDefault();
          }
        },
        true
      );
      if (typeof navigator.serviceWorker !== "undefined") {
        navigator.serviceWorker.register("sw.js");
      }
    }
  }, []);

  return (
    <TootlipProvider>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <HelmetProvider>
            <Helmet>
              <title>Upscale your guitar skills</title>
              <link rel="manifest" href="manifest.json" />
              <meta name="google" content="notranslate" />
            </Helmet>
            <View style={tw`w-full h-full`}>
              <Main />
              <StatusBar style="auto" />
            </View>
          </HelmetProvider>
        </PersistGate>
      </Provider>
    </TootlipProvider>
  );
}

registerRootComponent(App);
