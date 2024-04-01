import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import Fretboard from "./Fretboard";
import tw from "./tailwind";

export default function App() {
  return (
    <View style={tw`w-full h-full items-start bg-white`}>
      <Fretboard />
      <StatusBar style="auto" />
    </View>
  );
}
