import { useRef } from "react";

export const useInputChecker = () => {
  return useRef<boolean>(window.matchMedia("(pointer:coarse)").matches).current;
};
