"use client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { Main } from "./components/Main";
import { persistor, store } from "./store/store";

export default function Home() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Main />
      </PersistGate>
    </Provider>
  );
}
