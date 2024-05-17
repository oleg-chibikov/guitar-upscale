import { Note } from "@/app/data/notes";
import { Theme } from "@/app/data/theme";
import {
  loadMetronome,
  playMetronomeBeat,
} from "@/app/engine/sound/metronomeProvider";
import { loadInstrument } from "@/app/engine/sound/soundHelper";
import { playNote } from "@/app/engine/sound/soundProvider";
import { useGooglePlayAuth } from "@/app/hooks/useGooglePlayAuth";
import { useSessionAuth } from "@/app/hooks/useSessionAuth";
import {
  chordInstrumentValue,
  init,
  instrumentValue,
  reverbStrengthValue,
} from "@/app/store/settingsSlice";
import { selectUi } from "@/app/store/uiSlice";
import { useEffect } from "react";
import ReactGA from "react-ga4";
import { useDispatch, useSelector } from "react-redux";

export const Initializer: React.FC = () => {
  const { theme } = useSelector(selectUi);
  const dispatch = useDispatch();
  useSessionAuth();
  useGooglePlayAuth();

  useEffect(() => {
    dispatch(init());
  }, [dispatch]);

  useEffect(() => {
    const loadErudaDevTools = async () => {
      // TODO: Check if available in a server function
      const eruda = (await import("eruda")).default;
      eruda.init();
    };
    loadErudaDevTools();
  }, []);

  useEffect(() => {
    const remove = () => {
      document.body.removeEventListener("scroll", handleFirstInteraction);
      document.body.removeEventListener("keydown", handleFirstInteraction);
      document.body.removeEventListener("click", handleFirstInteraction);
      document.body.removeEventListener("touchstart", handleFirstInteraction);
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

    document.body.addEventListener("scroll", handleFirstInteraction);
    document.body.addEventListener("keydown", handleFirstInteraction);
    document.body.addEventListener("click", handleFirstInteraction);
    document.body.addEventListener("touchstart", handleFirstInteraction);

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
  return null;
};
