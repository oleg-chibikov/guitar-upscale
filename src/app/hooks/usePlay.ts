import { EventsByTick } from "@/app/engine/eventsByTick";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactGA from "react-ga4";
import { useDispatch, useSelector } from "react-redux";
import { AlertType } from "../data/alertType";
import { Example } from "../data/example";
import { getNoteText } from "../data/notes";
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
  clearWipeExampleCacheTrigger,
  isPlayingValue,
  playbackTypeValue,
  reverbStrengthValue,
  scaleValue,
  selectSettings,
  setIsPlaying,
  setTempoBpm,
  tempoBpmValue,
  wipeExampleCacheTriggerValue,
} from "../store/settingsSlice";
import { setAndShowAlert } from "../store/uiSlice";

const melodyType = PlaybackType.Melody;
const fullStringScaleType = PlaybackType.FullStringScale;
const LOG_PREFIX = "usePlay: ";

export interface UsePlayParams {
  decodeExample?: (example: Example) => Promise<EventsByTick>;
}

export const usePlay = ({ decodeExample }: UsePlayParams) => {
  const { guitarSettingsUpdatedTrigger } = useSelector(selectSettings);
  const [isWaiting, setIsWaiting] = useState(false);
  // a ref is updated along with the state. It's needed to immediately mark playback as active and therefore prevent any double playback if clicked simultaneously
  const isWaitingRef = useRef<boolean>();

  const updateWaiting = (value: boolean) => {
    setIsWaiting(value);
    isWaitingRef.current = value;
  };

  const dispatch = useDispatch();

  const handlePlay = useCallback(async () => {
    if (isWaitingRef.current) {
      console.log(
        LOG_PREFIX +
          "Already waiting for playback to start, skipping new request"
      );
      return;
    }
    console.log(LOG_PREFIX, "Loading examples");
    updateWaiting(true);
    const { playMidi, stopPlayback } = await import("@/app/engine/midiPlayer");
    if (isPlayingValue) {
      await stopPlayback(dispatch, LOG_PREFIX);
      updateWaiting(false);
      return;
    }

    let example: Example | undefined;
    if (decodeExample && playbackTypeValue === melodyType) {
      const { getRandomScaleExample, wipeExamplesCache } = await import(
        "@/app/data/scaleExamples"
      );
      if (wipeExampleCacheTriggerValue) {
        wipeExamplesCache();
        clearWipeExampleCacheTrigger();
      }
      example = await getRandomScaleExample();
      const tempo = example?.tempo;
      if (tempo !== undefined && tempo !== tempoBpmValue) {
        dispatch(setTempoBpm({ tempo: tempo, updateInterval: false }));
      }
    } else {
      await import("@/app/engine/decoders/scaleDecoder");
    }

    // the instrument should be initialized before waiting for the first note
    // init metronome here as we don't want to get glitches if it gets turned on during playing
    const trackInstrumentPromises =
      example?.tracks.map((track) =>
        track.instrument !== undefined
          ? loadInstrument(track.instrument, reverbStrengthValue)
          : Promise.resolve()
      ) ?? [];

    await Promise.all(trackInstrumentPromises);

    let {
      eventsByTick,
      message,
    }: { eventsByTick: EventsByTick; message: string } = await decode(
      decodeExample,
      example
    );

    if (!eventsByTick.hasItems) {
      return;
    }

    // Start playback
    console.log(LOG_PREFIX + "Waiting for playback to start...");
    await waitForStart(example);
    console.log(LOG_PREFIX + "Start playing");
    ReactGA.event({
      category: "Playback",
      action: "Playback started",
    });

    dispatch(setAndShowAlert({ message, alertType: AlertType.Neutral }));

    await playMidi(dispatch, eventsByTick, LOG_PREFIX, () => {
      // remove the waiting mark only after the playback has started. If it's done earlier - race conditions are possible
      console.log(
        LOG_PREFIX + "The playback has started. Removing the waiting mark"
      );

      updateWaiting(false);
    });
  }, [dispatch, decodeExample]);

  useEffect(() => {
    // stop playing when any of dependencies changes
    dispatch(setIsPlaying(false));
  }, [guitarSettingsUpdatedTrigger, dispatch]);

  useEffect(() => {
    const handleKeyPress = async (event: KeyboardEvent) => {
      if (event.code === "Space") {
        // Call your function here
        await handlePlay();
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
async function waitForStart(example: Example | undefined) {
  if (isMainClockActive()) {
    // if metronome or chord strumming is already playing then wait for the bar, other
    console.log(LOG_PREFIX + "Waiting for the next bar");
    if (example?.halfBeatShift !== undefined && example.halfBeatShift) {
      // wait for the remainder of the beats till desired value
      const desiredHalfBeat = HALF_BEATS_IN_BAR - example.halfBeatShift + 1;
      let halfBeatsToWait = desiredHalfBeat - currentHalfBeat;
      if (halfBeatsToWait < 0) {
        // If play starts too close (less than tickShift ticks) to the next bar - wait for the bar after
        halfBeatsToWait = HALF_BEATS_IN_BAR + halfBeatsToWait;
      }
      console.log(
        LOG_PREFIX +
          `Current ${currentHalfBeat}; desired: ${desiredHalfBeat}; toWait: ${halfBeatsToWait}`
      );
      for (let i = 0; i < halfBeatsToWait; i++) {
        await waitForNextHalfBeat();
      }
    } else {
      await waitForNextBar();
    }
  }
}

async function decode(
  decodeExample: ((example: Example) => Promise<EventsByTick>) | undefined,
  example: Example | undefined
) {
  let eventsByTick: EventsByTick;
  let message: string;
  if (decodeExample && example && playbackTypeValue === melodyType) {
    // this sets decoded melody in the example
    eventsByTick = await decodeExample(example);
    message = `${example.band} - ${example.title}`;
  } else {
    const isFullStringScalePlayback = playbackTypeValue === fullStringScaleType;
    message = `${getNoteText(baseNoteValue)} ${scaleValue} ${
      isFullStringScalePlayback ? " (full string)" : ""
    }`;

    const { getWholeScale } = await import(
      "@/app/engine/decoders/scaleDecoder"
    );
    eventsByTick = getWholeScale(isFullStringScalePlayback);
  }
  return { eventsByTick, message };
}
