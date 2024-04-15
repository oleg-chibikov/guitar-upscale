"use client";
import { useEffect } from "react";
// import { Main } from "./components/Main";

import { Helmet, HelmetProvider } from "react-helmet-async";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistor, store } from "./store/store";

export default function Home() {
  useEffect(() => {
    // Orientation.lockToLandscape(); // this will lock the view to Landscape

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
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <HelmetProvider>
          <Helmet>
            <title>Upscale your guitar skills</title>
            <link rel="manifest" href="manifest.json" />
            <meta name="google" content="notranslate" />
          </Helmet>
          <main className="w-full h-full">{/* <Main /> */}</main>
        </HelmetProvider>
      </PersistGate>
    </Provider>
  );
}
