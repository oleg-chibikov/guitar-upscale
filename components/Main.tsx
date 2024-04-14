import React, { useEffect, useState } from "react";
import {
  Dimensions,
  ScaledSize,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  Skin,
  hideAlert,
  init,
  setSettingsExpanded,
} from "../store/controlPanelSlice";
import { RootState } from "../store/store";
import { tw } from "../tailwind";
import { AnimatedAlert } from "./AnimatedAlert";
import { Fretboard } from "./Fretboard";
import { ControlPanel } from "./settings/ControlPanel";

// TODO
// youtube videos for each scale
// get the formula to avoid hardcoding each string height offset
// more instruments + dropdown
// Slider - used HTML element - most likely won't work for Native
// more examples
// Guitar tunings
// 7,8 string guitars
// Ads
// Record melodies to saveable midi files
// Melodies chords - separate fixed settings (add settings to Bus event)
// select how many notes to play max in the chord

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
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(init());
  }, []);
  const [highResLoaded, setHighResLoaded] = useState(false);
  const [scaleFactor, setScaleFactor] = useState(1);
  const {
    showAlert: isAlertShown,
    alertMessage,
    mainBg,
    fretboardScaleX,
    fretboardScaleY,
    skin,
  } = useSelector((state: RootState) => state.controlPanel);

  const [retrigger, setRetrigger] = useState<boolean>(false);

  useEffect(() => {
    // Update the background color when the state changes
    (document.body.style.backgroundColor as any) = tw.color(mainBg);
  }, [mainBg]);

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
    setRetrigger(true);
    setTimeout(() => setRetrigger(false), 1);
  }, [fretboardScaleX, fretboardScaleY]);

  useEffect(() => {
    setHighResLoaded(false);
  }, [skin]);

  const handleCloseAlert = () => {
    dispatch(hideAlert());
  };

  const assets = getAssetsForSkin(skin);
  if (retrigger) {
    // I didn't find a better way to reflow the page and therefore re-render the scrollbars which need adjusting after scale changes
    // The only solution I found is to return this template view and then straight away return the original one but with scale applied
    return (
      <View
        style={[tw`${mainBg} min-w-full min-h-full items-start justify-center`]}
      >
        <Text>Retriggering</Text>
      </View>
    );
  }
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
            tw`${mainBg} min-w-full min-h-full items-start justify-center`,
          ]}
        >
          <Fretboard
            scaleFactor={scaleFactor}
            imageSource={assets[1]}
            onImageLoaded={() => {
              console.log("Loaded full res image");
              setHighResLoaded(true);
            }}
            isCollapsed={!highResLoaded}
          />
        </View>
      </TouchableWithoutFeedback>
    </>
  );
};
