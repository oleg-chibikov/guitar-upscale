// store.ts
import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "redux";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";

import controlPanelReducer from "./controlPanelSlice";

const rootReducer = combineReducers({
  controlPanel: controlPanelReducer,
});

const VERSION = 2;

const persistConfig = {
  key: "root",
  version: VERSION,
  storage,
  migrate: (state: any) => {
    if (typeof window === "undefined") {
      return Promise.resolve(state);
    }
    console.log("Checking migration needed");
    const storedVersionRaw = localStorage.getItem("reduxPersist:root:version");
    const setCurrentVersionToLocalStorage = () => {
      console.log("Setting version " + VERSION);
      localStorage.setItem("reduxPersist:root:version", VERSION.toString());
    };
    if (storedVersionRaw === null) {
      persistor.purge(); // if there is something before introducing versions
      setCurrentVersionToLocalStorage();
      return Promise.resolve(state);
    }
    const storedVersion = parseInt(storedVersionRaw);
    console.log("Currently stored version: " + storedVersion);
    if (storedVersion !== VERSION) {
      console.log(
        "Purging version" +
          storedVersion +
          " as there is a newer version " +
          VERSION
      );
      // Clear previous state if version has changed
      persistor.purge();
      setCurrentVersionToLocalStorage();
    }
    return Promise.resolve(state);
  },
  transforms: [
    {
      in: (state: any) => {
        const newState = { ...state };
        delete newState.neck;
        delete newState.chords;
        delete newState.isRecording;
        delete newState.signInCheckCount;
        return newState;
      },
      out: (state: any) => state, // No transformation needed when deserializing
    },
  ],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  devTools: true,
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }), // The application stores a Set to improve its performance
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
