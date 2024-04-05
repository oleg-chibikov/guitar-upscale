import { useEffect, useState } from "react";
import { Dimensions, ScaledSize } from "react-native";

export const useScreenOrientation = () => {
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "landscape"
  );

  const checkOrientation = (dimensions: ScaledSize) => {
    const { width, height } = dimensions;

    setOrientation(width > height ? "landscape" : "portrait");
  };
  useEffect(() => {
    var handler = Dimensions.addEventListener("change", (e) => {
      checkOrientation(e.screen);
    });
    checkOrientation(Dimensions.get("screen"));
    return () => handler.remove();
  }, []);

  return orientation;
};
