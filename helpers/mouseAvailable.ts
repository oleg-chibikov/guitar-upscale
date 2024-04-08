import { useRef } from "react";
import { Platform } from "react-native";

export const mouseAvailable = () => {
  return useRef<boolean>(
    Platform.OS === "web" && window.matchMedia("(pointer:fine)").matches
  ).current;
};
