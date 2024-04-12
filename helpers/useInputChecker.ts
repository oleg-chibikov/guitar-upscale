import { useRef } from "react";
import { Platform } from "react-native";

export const useInputChecker = () => {
  return useRef<boolean>(
    Platform.OS === "web" && window.matchMedia("(pointer:coarse)").matches
  ).current;
};
