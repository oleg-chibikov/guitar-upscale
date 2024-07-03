import { Theme } from "@/app/data/theme";
import { useUiSelector } from "@/app/hooks/storeHooks";
import { useEffect, useRef } from "react";
import ReactGA from "react-ga4";
import { useDispatch } from "react-redux";
import { Note } from "../data/notes";
import {
  loadMetronome,
  playMetronomeBeat,
} from "../engine/sound/metronomeProvider";
import { loadInstrument } from "../engine/sound/soundHelper";
import { playNote } from "../engine/sound/soundProvider";
import { useGooglePlayAuth } from "../hooks/useGooglePlayAuth";
import { useSessionAuth } from "../hooks/useSessionAuth";
import {
  chordInstrumentValue,
  init,
  instrumentValue,
  reverbStrengthValue,
} from "../store/settingsSlice";
import { initUi } from "../store/uiSlice";

export const Initializer: React.FC = () => {
  const theme = useUiSelector((s) => s.theme);
  const dispatch = useDispatch();
  useSessionAuth();
  useGooglePlayAuth();
  const isInitialized = useRef(false);

  useEffect(() => {
    // to make sure it doesn't happen twice
    if (isInitialized.current) {
      return;
    }
    dispatch(init());
    dispatch(initUi());
    isInitialized.current = true;
  }, [dispatch]);

  useEffect(() => {
    const remove = () => {
      document.body.removeEventListener("scroll", handleFirstInteraction, true);
      document.body.removeEventListener(
        "keydown",
        handleFirstInteraction,
        true
      );
      document.body.removeEventListener("click", handleFirstInteraction, true);
      document.body.removeEventListener(
        "touchstart",
        handleFirstInteraction,
        true
      );
    };

    const handleFirstInteraction = async () => {
      remove();
      console.log("Preloading sounds...");
      // first click anywhere loads instruments
      await Promise.all([
        loadInstrument(instrumentValue, reverbStrengthValue),
        loadInstrument(chordInstrumentValue, reverbStrengthValue),
        loadMetronome(),
      ]);
      await Promise.all([
        playNote(
          { note: Note.E, octave: 1 },
          0,
          instrumentValue,
          reverbStrengthValue,
          1
        ),
        playNote(
          { note: Note.E, octave: 1 },
          0,
          chordInstrumentValue,
          reverbStrengthValue,
          1
        ),
        playMetronomeBeat(false, 0),
      ]);
      console.log("Loaded sounds");
    };

    document.body.addEventListener("scroll", handleFirstInteraction, true);
    document.body.addEventListener("keydown", handleFirstInteraction, true);
    document.body.addEventListener("click", handleFirstInteraction, true);
    document.body.addEventListener("touchstart", handleFirstInteraction, true);

    return () => {
      remove();
    };
  }, []);

  useEffect(() => {
    const mainBg =
      theme === Theme.Light ? "bg-background-light" : "bg-background-dark";
    document.body.classList.add(mainBg);
    return () => document.body.classList.remove(mainBg);
  }, [theme]);

  useEffect(() => {
    // Multiple products (previously known as trackers)
    ReactGA.initialize([
      {
        trackingId: "G-0NYT2JD8C4",
      },
    ]);
    ReactGA.send({
      hitType: "pageview",
      page: "/",
      title: "Main page",
    });
  }, []);

  useEffect(() => {
    // prevent the Google translate bottom popup from appearing on mobile screen
    document.addEventListener(
      "click",
      function (event: MouseEvent) {
        const elementTarget = event.target as Element;
        if (
          elementTarget !== undefined &&
          (elementTarget.nodeName === "UL" ||
            elementTarget.nodeName === "LI" ||
            elementTarget.nodeName === "SPAN")
        ) {
          event.preventDefault();
        }
      },
      true
    );

    if (typeof navigator.serviceWorker !== "undefined") {
      void navigator.serviceWorker.register("/sw.js");
    }
  }, []);
  return null;
};
