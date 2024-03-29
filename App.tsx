import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import Fretboard from "./Fretboard";

export default function App() {
  return (
    <View style={styles.container}>
      <Fretboard />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
    // overflow: "hidden",
    backgroundColor: "#fff",
  },
});
