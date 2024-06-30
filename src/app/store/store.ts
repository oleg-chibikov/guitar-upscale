// store.ts
import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "redux";
import { PersistedState, persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";

import authReducer from "./authSlice";
import settingsReducer from "./settingsSlice";
import uiReducer from "./uiSlice";

const rootReducer = combineReducers({
  settings: settingsReducer,
  ui: uiReducer,
  auth: authReducer,
});

const VERSION = 9;

const persistConfig = {
  key: "root",
  version: VERSION,
  storage,
  migrate: (state: PersistedState) => {
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
      void persistor.purge(); // if there is something before introducing versions
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
      void persistor.purge();
      setCurrentVersionToLocalStorage();
    }
    return Promise.resolve(state);
  },
  transforms: [
    {
      in: (state: PersistedState) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newState = { ...state } as any; // TODO: I don't understand it fully, but it works like this
        delete newState.neck;
        delete newState.stringCount;
        delete newState.settingsExpanded;
        // delete newState.chordsExpanded; // chords could stay expanded
        // delete newState.controlPanelExpanded; // control panel could stay expanded
        delete newState.strummingSettingsExpanded;
        delete newState.strummingPatternEditorExpanded;
        delete newState.showAlert;
        delete newState.alertType;
        delete newState.alertTimeout;
        delete newState.alertMessage;
        delete newState.suggestedScales;
        delete newState.showScalesAlert;
        delete newState.isMetronomeActive;
        delete newState.chordIsBeingDetected;
        delete newState.scaleIsBeingDetected;
        delete newState.isRecording;
        delete newState.subscriptionTier;
        delete newState.premiumFeatures;
        delete newState.isLastEvent;
        delete newState.isFirstEvent;
        delete newState.showAspectRatio;
        delete newState.chordModesCount;
        return newState;
      },
      out: (state: PersistedState) => state, // No transformation needed when deserializing
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
