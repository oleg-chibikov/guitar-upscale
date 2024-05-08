"use client";
import { Theme } from "@/app/data/theme";
import { useEffect } from "react";
import ReactGA from "react-ga4";
import { useDispatch, useSelector } from "react-redux";
import { Note } from "../data/notes";
import {
  loadMetronome,
  playMetronomeBeat,
} from "../engine/sound/metronomeProvider";
import { loadInstrument } from "../engine/sound/soundHelper";
import { playNote } from "../engine/sound/soundProvider";
import {
  chordInstrumentValue,
  init,
  instrumentValue,
  reverbStrengthValue,
} from "../store/settingsSlice";
import { selectUi } from "../store/uiSlice";

export const Initializer: React.FC = () => {
  const { theme } = useSelector(selectUi);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(init());
  }, [dispatch]);

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

  useEffect(() => {
    const getDigitalGoodService = async () => {
      // TODO: IT'S FOR TESTING
      if ("getDigitalGoodsService" in window) {
        const getDigitalGoodsService = window.getDigitalGoodsService;
        // Digital Goods API is supported!
        let service: DigitalGoodsService;
        try {
          service = await getDigitalGoodsService(
            "https://play.google.com/billing"
          );
          // Google Play Billing is supported!
        } catch (error) {
          // Google Play Billing is not available. Use another payment flow.
          alert("Cannot get Billing service");
          return;
        }
        try {
          const details = await service.getDetails(["guitar_upscale.composer"]);
          alert(JSON.stringify(details));
          for (const item of details) {
            // Format the price according to the user locale.
            const localizedPrice = new Intl.NumberFormat(navigator.language, {
              style: "currency",
              currency: item.price.currency,
            }).format(parseFloat(item.price.value));

            // Render the price to the UI.
            alert(
              [
                item.itemId,
                item.title,
                JSON.stringify(item.price),
                localizedPrice,
                item.description,
              ].join("|")
            );
          }
        } catch {
          alert("Cannot get Subscription Tier details from billing service");
          return;
        }
      } else {
        alert("No digital goods service");
      }
    };
    getDigitalGoodService();
  }, []);
  return null;
};
