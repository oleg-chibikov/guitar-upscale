import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { initSoundfont } from "../engine/soundProvider";
import {
  Theme,
  hideAlert,
  init,
  selectControlPanel,
} from "../store/controlPanelSlice";
import { AnimatedAlert } from "./AnimatedAlert";
import { Fretboard } from "./fret/Fretboard";
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
// More chords
// Patreon subscriptions

export const Main = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(init());
  }, [dispatch]);

  const {
    showAlert: isAlertShown,
    alertMessage,
    theme,
    fretboardScaleX,
    fretboardScaleY,
  } = useSelector(selectControlPanel);

  const [retrigger, setRetrigger] = useState<boolean>(false);

  useEffect(() => {
    const mainBg =
      theme === Theme.Light ? "bg-background-light" : "bg-background-dark";
    document.body.classList.add(mainBg);
    return () => document.body.classList.remove(mainBg);
  }, [theme]);

  useEffect(() => {
    setRetrigger(true);
    setTimeout(() => setRetrigger(false), 1);
  }, [fretboardScaleX, fretboardScaleY]);

  useEffect(() => {
    initSoundfont();
  }, []);

  useEffect(() => {
    // Orientation.lockToLandscape(); // this will lock the view to Landscape

    // prevent the Google translate bottom popup from appearing on mobile screen
    document.addEventListener(
      "click",
      function (event: any) {
        if (
          event.target.nodeName === "UL" ||
          event.target.nodeName === "LI" ||
          event.target.nodeName === "SPAN"
        ) {
          event.preventDefault();
        }
      },
      true
    );

    if (typeof navigator.serviceWorker !== "undefined") {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  const handleCloseAlert = () => {
    dispatch(hideAlert());
  };

  // retriggering is needed to refresh scrollbars, otherwise they stay not updated
  if (retrigger) {
    return null;
  }

  return (
    <main>
      {isAlertShown && (
        <AnimatedAlert message={alertMessage} onClose={handleCloseAlert} />
      )}
      <ControlPanel />
      <Fretboard />
    </main>
  );
};
