// store.ts
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage for React Native
import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "redux";
import { persistReducer, persistStore } from "redux-persist";

import controlPanelReducer from "./controlPanelSlice";

const rootReducer = combineReducers({
  controlPanel: controlPanelReducer,
});

const persistConfig = {
  key: "root",
  storage: AsyncStorage,
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
