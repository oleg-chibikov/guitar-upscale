// store.ts
import { configureStore, Reducer } from "@reduxjs/toolkit";
import { combineReducers } from "redux";
import { createMigrate, persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";

import authReducer from "./authSlice";
import { looperGuard } from "./looperGuard";
import pianoRollReducer from "./pianoRollSlice";
import settingsReducer from "./settingsSlice";
import uiReducer from "./uiSlice";

// Raising it drops the saved state of every slice
const VERSION = 11;

// the whole state used to sit under one key
if (typeof window !== "undefined") {
  localStorage.removeItem("persist:root");
  localStorage.removeItem("reduxPersist:root:version");
}

const persistSlice = <S>(
  key: string,
  reducer: Reducer<S>,
  blacklist: (keyof S & string)[] = [],
) =>
  persistReducer(
    {
      key,
      version: VERSION,
      storage,
      blacklist,
      migrate: createMigrate({ [VERSION]: () => undefined }),
    },
    reducer,
  );

const rootReducer = combineReducers({
  pianoRoll: persistSlice("pianoRoll", pianoRollReducer),
  settings: persistSlice("settings", settingsReducer, [
    "neck",
    "stringCount",
    "isMetronomeActive",
    "chordIsBeingDetected",
    "scaleIsBeingDetected",
    "isRecording",
    "isLastEvent",
    "isFirstEvent",
    "guitarSettingsUpdateCount",
    "chordsAreLoading",
  ]),
  ui: persistSlice("ui", uiReducer, [
    "settingsExpanded",
    "strummingSettingsExpanded",
    "strummingPatternEditorExpanded",
    "showAlert",
    "alertType",
    "alertTimeout",
    "alertMessage",
    "suggestedScales",
    "showScalesAlert",
    "showAspectRatio",
  ]),
  auth: persistSlice("auth", authReducer, ["subscriptionTier"]),
});

export const store = configureStore({
  devTools: true,
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(looperGuard), // The application stores a Set to improve its performance
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
