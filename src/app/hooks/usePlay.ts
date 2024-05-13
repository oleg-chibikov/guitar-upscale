import { useCallback, useEffect, useState } from "react";
import ReactGA from "react-ga4";
import { useDispatch, useSelector } from "react-redux";
import { AlertType } from "../data/alertType";
import { Example } from "../data/example";
import { getNoteText } from "../data/notes";
import { PlayExampleParameters } from "../data/playExampleParameters";
import { PlaybackType } from "../data/playbackType";
import {
  HALF_BEATS_IN_BAR,
  currentHalfBeat,
  isMainClockActive,
  waitForNextBar,
  waitForNextHalfBeat,
} from "../engine/mainClock";
import { loadInstrument } from "../engine/sound/soundHelper";
import {
  baseNoteValue,
  isPlayingValue,
  playbackTypeValue,
  reverbStrengthValue,
  scaleValue,
  selectSettings,
  setIsPlaying,
  setTempoBpm,
  tempoBpmValue,
} from "../store/settingsSlice";
import { setAndShowAlert } from "../store/uiSlice";

const melodyType = PlaybackType.Melody;
const fullStringScaleType = PlaybackType.FullStringScale;

export interface UsePlayParams {
  onPlayExample?: (params: PlayExampleParameters) => Promise<void>;
}

export const usePlay = ({ onPlayExample }: UsePlayParams) => {
  const { neck } = useSelector(selectSettings);
  const [isWaiting, setIsWaiting] = useState(false);
  const dispatch = useDispatch();

  const handlePlay = useCallback(async () => {
    if (!neck) {
      return;
    }

    if (isPlayingValue) {
      // If already playing, stop playback
      dispatch(setIsPlaying(false));
      return;
    }

    let example: Example | undefined;
    if (onPlayExample) {
      const { getRandomScaleExample } = await import(
        "@/app/data/scaleExamples"
      );
      example = await getRandomScaleExample();
      const tempo = example?.tempo;
      if (tempo && tempo !== tempoBpmValue) {
        dispatch(setTempoBpm({ tempo: tempo, updateInteval: false }));
      }
    } else {
      await import("@/app/engine/play/scalePlayer");
    }

    // the instrument should be initialized before waiting for the first note
    // init metronome here as we don't want to get glitches if it gets turned on during playing
    const trackInstrumentPromises =
      example?.tracks.map(
        (track) =>
          track.instrument &&
          loadInstrument(track.instrument, reverbStrengthValue)
      ) ?? [];

    await Promise.all(trackInstrumentPromises);

    ReactGA.event({
      category: "Playback",
      action: "Playback started",
    });

    // Start playback
    if (isMainClockActive()) {
      setIsWaiting(true);
      // if metronome or chord strumming is already playing then wait for the bar, other
      console.log("Waiting for the next bar");
      if (example?.halfBeatShift) {
        // wait for the remainder of the beats till desired value
        const desiredHalfBeat = HALF_BEATS_IN_BAR - example.halfBeatShift + 1;
        let halfBeatsToWait = desiredHalfBeat - currentHalfBeat;
        if (halfBeatsToWait < 0) {
          // If play starts too close (less than tickShift ticks) to the next bar - wait for the bar after
          halfBeatsToWait = HALF_BEATS_IN_BAR + halfBeatsToWait;
        }
        console.log(
          `Current ${currentHalfBeat}; desired: ${desiredHalfBeat}; toWait: ${halfBeatsToWait}`
        );
        for (var i = 0; i < halfBeatsToWait; i++) {
          await waitForNextHalfBeat();
        }
      } else {
        await waitForNextBar();
      }

      setIsWaiting(false);
    }

    try {
      console.log("Start playing");
      dispatch(setIsPlaying(true));
      const dispatchAlert = (message: string) =>
        dispatch(setAndShowAlert({ message, alertType: AlertType.Neutral }));
      if (onPlayExample && example && playbackTypeValue === melodyType) {
        await onPlayExample({
          example,
          waitNote: waitForNextHalfBeat,
          neck,
          showAlert: dispatchAlert,
        });
      } else {
        const isFullStringScalePlayback =
          playbackTypeValue === fullStringScaleType;
        dispatchAlert(
          `${getNoteText(baseNoteValue)} ${scaleValue} ${
            isFullStringScalePlayback ? " (full string)" : ""
          }`
        );

        const { playWholeScale } = await import(
          "@/app/engine/play/scalePlayer"
        );
        await playWholeScale(
          waitForNextHalfBeat,
          neck,
          isFullStringScalePlayback
        );
      }
    } finally {
      dispatch(setIsPlaying(false));
    }
  }, [dispatch, neck, onPlayExample]);

  useEffect(() => {
    // stop playing when any of dependencies changes
    dispatch(setIsPlaying(false));
  }, [neck, dispatch]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        // Call your function here
        handlePlay();
      }
    };

    // Add event listener when the component mounts
    document.addEventListener("keydown", handleKeyPress);

    // Remove event listener when the component unmounts
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [handlePlay]); // Empty dependency array ensures that this effect runs only once, similar to componentDidMount

  return { isWaiting, handlePlay };
};
