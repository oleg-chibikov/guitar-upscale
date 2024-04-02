import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import Orientation from "react-native-orientation-locker";
import { Main } from "./components/Main";
import tw from "./tailwind";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistor, store } from "./store/store";

export default function App() {
  useEffect(() => {
    Orientation.lockToLandscape(); // this will lock the view to Landscape
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <View style={tw`w-full h-full`}>
          <Main />
          <StatusBar style="auto" />
        </View>
      </PersistGate>
    </Provider>
  );
}
