import { EventsByTick } from "@/app/engine/eventsByTick";
import { MidiPlayer } from "@/app/engine/midiPlayer";
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

export interface UsePlayParams {
  decodeExample?: (params: PlayExampleParameters) => Promise<EventsByTick>;
}

export const usePlay = ({ decodeExample }: UsePlayParams) => {
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

    ReactGA.event({
      category: "Playback",
      action: "Playback started",
    });

    // Start playback
    if (isMainClockActive()) {
      setIsWaiting(true);
      // if metronome or chord strumming is already playing then wait for the bar, other
      console.log("Waiting for the next bar");
      if (example?.halfBeatShift !== undefined && example.halfBeatShift) {
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
        for (let i = 0; i < halfBeatsToWait; i++) {
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

      let eventsToPlay: EventsByTick;
      let message: string;
      if (decodeExample && example && playbackTypeValue === melodyType) {
        // this sets decoded melody in the example
        eventsToPlay = await decodeExample({
          example,
          neck,
        });
        message = `${example.band} - ${example.title}`;
      } else {
        const isFullStringScalePlayback =
          playbackTypeValue === fullStringScaleType;
        message = `${getNoteText(baseNoteValue)} ${scaleValue} ${
          isFullStringScalePlayback ? " (full string)" : ""
        }`;

        const { getWholeScale } = await import(
          "@/app/engine/decoders/scaleDecoder"
        );
        eventsToPlay = getWholeScale(neck, isFullStringScalePlayback);
      }

      dispatch(setAndShowAlert({ message, alertType: AlertType.Neutral }));
      const player = new MidiPlayer(eventsToPlay);
      await player.play();
    } finally {
      dispatch(setIsPlaying(false));
    }
  }, [dispatch, neck, decodeExample]);

  useEffect(() => {
    // stop playing when any of dependencies changes
    dispatch(setIsPlaying(false));
  }, [neck, dispatch]);

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
