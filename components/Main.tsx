import React, { useEffect, useState } from "react";
import {
  Dimensions,
  ScaledSize,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { hideAlert, setSettingsExpanded } from "../store/controlPanelSlice";
import { RootState } from "../store/store";
import tw from "../tailwind";
import AnimatedAlert from "./AnimatedAlert";
import ControlPanel from "./ControlPanel";
import { Fretboard } from "./Fretboard";
import PinchableBox from "./PinchableBox";

// TODO
// dark/light
// youtube videos for each scale
// get the formula to avoid hardcoding each string
// more instruments + dropdown
// Alternative to youtube - code melodies with the language

export const Main: React.FC = () => {
  const [highResLoaded, setHighResLoaded] = useState(false);
  const [scaleFactor, setScaleFactor] = useState(1);
  const { showAlert: isAlertShown, alertMessage } = useSelector(
    (state: RootState) => state.controlPanel
  );
  const dispatch = useDispatch();

  const recalculateScaleFactor = (size: ScaledSize) => {
    const isLandscape = size.width > size.height;
    const baseScale = 0.5;

    const scaleFactor =
      baseScale +
      (isLandscape
        ? Math.log10(size.width / size.height)
        : Math.log10(size.height / size.width));
    setScaleFactor(scaleFactor * size.fontScale);
  };

  useEffect(() => {
    var handler = Dimensions.addEventListener("change", (e) =>
      // TODO: Debounce
      recalculateScaleFactor(e.window)
    );
    recalculateScaleFactor(Dimensions.get("window"));
    return () => handler.remove();
  }, []);

  const handleCloseAlert = () => {
    dispatch(hideAlert());
  };

  return (
    <>
      {isAlertShown && (
        <AnimatedAlert message={alertMessage} onClose={handleCloseAlert} />
      )}

      <ControlPanel />
      <TouchableWithoutFeedback
        onPress={() => {
          dispatch(setSettingsExpanded(false));
        }}
      >
        <View style={[tw`w-full h-full items-start justify-center`]}>
          <PinchableBox>
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
          </PinchableBox>
        </View>
      </TouchableWithoutFeedback>
    </>
  );
};
