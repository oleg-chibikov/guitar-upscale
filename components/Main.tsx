import React, { useEffect, useState } from "react";
import { Dimensions, ScaledSize, View } from "react-native";
import tw from "../tailwind";
import ControlPanel from "./ControlPanel";
import { Fretboard } from "./Fretboard";

// TODO
// More scales
// Scales by category - classical, expitic, major, minor, japanese, arabic, gypsy. several levels of nesting
// dark/light
// youtube videos for each scale
// get the formula to avoid hardcoding each string
// more instruments + dropdown
// menu layout
// zoom with pinch

export const Main: React.FC = () => {
  const [highResLoaded, setHighResLoaded] = useState(false);
  const [scaleFactor, setScaleFactor] = useState(1);

  const recalculateScaleFactor = (size: ScaledSize) => {
    const isLandscape = size.width > size.height;
    const baseScale = 0.5;

    const scaleFactor =
      baseScale +
      (isLandscape
        ? Math.log10(size.width / size.height)
        : Math.log(size.height / size.width));
    setScaleFactor(scaleFactor * size.fontScale);
  };

  useEffect(() => {
    Dimensions.addEventListener("change", (e) =>
      // TODO: Debounce
      recalculateScaleFactor(e.window)
    );
    recalculateScaleFactor(Dimensions.get("window"));
  }, []);

  return (
    <>
      <ControlPanel />
      <View
        style={[
          tw`overflow-hidden w-full h-full items-start justify-center bg-white`,
          { minWidth: 2300 * scaleFactor },
        ]}
      >
        {!highResLoaded && (
          <Fretboard
            scaleFactor={scaleFactor}
            imageSource={require("../assets/guitar_low.png")}
          />
        )}

        <Fretboard
          scaleFactor={scaleFactor}
          imageSource={require("../assets/guitar.png")}
          onImageLoaded={() => {
            console.log("Loaded full res image");
            setHighResLoaded(true);
          }}
          isCollapsed={!highResLoaded}
        />
      </View>
    </>
  );
};
