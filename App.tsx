import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import Orientation from "react-native-orientation-locker";
import { Main } from "./Main";
import tw from "./tailwind";

export default function App() {
  useEffect(() => {
    Orientation.lockToLandscape(); // this will lock the view to Landscape
  }, []);

  return (
    <View style={tw`w-full h-full`}>
      <Main />
      <StatusBar style="auto" />
    </View>
  );
}
