import { useState } from "react";

export const useInputChecker = () => {
  const [hasTouchInput] = useState(
    () => window.matchMedia("(pointer:coarse)").matches,
  );
  return hasTouchInput;
};
