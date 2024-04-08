import React, { useEffect, useState } from "react";
import {
  Dimensions,
  ScaledSize,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useDispatch } from "react-redux";
import {
  Skin,
  Theme,
  hideAlert,
  setSettingsExpanded,
} from "../store/controlPanelSlice";
import { RootState, useAppSelector } from "../store/store";
import { tw } from "../tailwind";
import { AnimatedAlert } from "./AnimatedAlert";
import { ControlPanel } from "./ControlPanel/ControlPanel";
import { Fretboard } from "./Fretboard";
import { PinchableBox } from "./PinchableBox";

// TODO
// youtube videos for each scale
// get the formula to avoid hardcoding each string height offset
// more instruments + dropdown
// Slider - used HTML element - most likely won't work for Native
// more examples
// Chords - layout, scrollable
// Chords generate them rather than hardcode
// Guitar tunings
// 7,8 string guitars
// Ads
// Record melodies to saveable midi files

const getAssetsForSkin = (skin?: Skin) => {
  switch (skin) {
    case Skin.PRS_SE_AX20E:
    case undefined:
      return [
        require(`../assets/guitar_low.webp`),
        require(`../assets/guitar.webp`),
      ];
    case Skin.Ibanez_AE140_WKH:
      return [
        require(`../assets/guitar2_low.webp`),
        require(`../assets/guitar2.webp`),
      ];
    case Skin.Yamaha_CSF3M:
      return [
        require(`../assets/guitar3_low.webp`),
        require(`../assets/guitar3.webp`),
      ];
    case Skin.Yamaha_SLG200NW:
      return [
        require(`../assets/guitar4_low.webp`),
        require(`../assets/guitar4.webp`),
      ];
  }
};

export const Main: React.FC = () => {
  const [highResLoaded, setHighResLoaded] = useState(false);
  const [scaleFactor, setScaleFactor] = useState(1);
  const {
    showAlert: isAlertShown,
    alertMessage,
    theme,
    selectedSkin,
  } = useAppSelector((state: RootState) => state.controlPanel);

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

  useEffect(() => {
    setHighResLoaded(false);
  }, [selectedSkin]);

  const handleCloseAlert = () => {
    dispatch(hideAlert());
  };

  const bg = theme === Theme.Dark ? "bg-neutral-800" : "bg-neutral-100";

  const assets = getAssetsForSkin(selectedSkin);

  return (
    <>
      {isAlertShown && (
        <AnimatedAlert message={alertMessage} onClose={handleCloseAlert} />
      )}

      <ControlPanel />
      <TouchableWithoutFeedback
        onPress={() => {
          dispatch(setSettingsExpanded(false));
          // dispatch(setChordsExpanded(false));
        }}
      >
        <View
          style={[
            tw`${bg} overflow-hidden w-full h-full items-start justify-center`,
          ]}
        >
          <PinchableBox>
            {!highResLoaded && (
              <Fretboard scaleFactor={scaleFactor} imageSource={assets[0]} />
            )}

            <Fretboard
              scaleFactor={scaleFactor}
              imageSource={assets[1]}
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
