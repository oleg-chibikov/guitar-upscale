import { useCallback, useEffect, useState } from "react";
import ReactGA from "react-ga4";
import { useDispatch, useSelector } from "react-redux";
import { Example } from "../data/example";
import { getNoteText } from "../data/notes";
import { PlayExampleParameters } from "../data/playExampleParameters";
import { PlaybackType } from "../data/playbackType";
import { parseStringToNotes } from "../data/tunings";
import {
  MAX_TICKS,
  currentTick,
  isIntervalSet,
  waitForNextBeat,
  waitForNextTick,
} from "../engine/mainClock";
import { initMetronome } from "../engine/sound/metronomeProvider";
import { initSoundfont } from "../engine/sound/soundHelper";
import {
  isPlayingValue,
  selectSettings,
  setIsPlaying,
  setTempoBpm,
} from "../store/settingsSlice";
import { setAndShowAlert } from "../store/uiSlice";

const melodyType = PlaybackType.Melody;
const fullStringScaleType = PlaybackType.FullStringScale;

export interface UsePlayParams {
  onPlayExample?: (params: PlayExampleParameters) => Promise<void>;
}

export const usePlay = ({ onPlayExample }: UsePlayParams) => {
  const {
    neck,
    tuning,
    baseNote,
    scale,
    scaleGroup,
    playbackType,
    instrument,
    chordInstrument,
    reverbStrength,
  } = useSelector(selectSettings);
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
      example = await getRandomScaleExample(scaleGroup, scale, reverbStrength);
    } else {
      await import("@/app/engine/play/scalePlayer");
    }

    // the instrument should be initialized before waiting for the first note
    // init metronome here as we don't want to get glitches if it gets turned on during playing
    const trackInstrumentPromises =
      example?.tracks.map(
        (track) =>
          track.instrument && initSoundfont(track.instrument, reverbStrength)
      ) ?? [];
    const loadInstrumentPromises = [
      ...trackInstrumentPromises,
      initSoundfont(instrument, reverbStrength),
      initSoundfont(chordInstrument, reverbStrength),
      initMetronome(),
    ];

    await Promise.all(loadInstrumentPromises);

    ReactGA.event({
      category: "Playback",
      action: "Playback started",
    });

    // Start playback
    if (isIntervalSet()) {
      setIsWaiting(true);
      // if metronome or chord strumming is already playing then wait for the beat, other
      console.log("Waiting for the next beat");
      if (example?.tickShift) {
        // wait for the remainder of the ticks till desired value
        const desiredTick = MAX_TICKS - example.tickShift + 1;
        const tick = currentTick;
        let ticksToWait = desiredTick - tick;
        if (ticksToWait < 0) {
          // If play starts too close (less than tickShift ticks) to the next beat - wait for the beat after
          ticksToWait = MAX_TICKS + ticksToWait;
        }
        for (var i = 0; i < ticksToWait; i++) {
          await waitForNextTick();
        }
      } else {
        await waitForNextBeat();
      }

      setIsWaiting(false);
    }

    try {
      console.log("Start playing");
      dispatch(setIsPlaying(true));
      const dispatchAlert = (message: string) =>
        dispatch(setAndShowAlert({ message, isError: false }));
      if (onPlayExample && example && playbackType === melodyType) {
        await onPlayExample({
          baseNote,
          example,
          waitNote: waitForNextTick,
          neck,
          tuning: parseStringToNotes(tuning),
          showAlert: dispatchAlert,
          setTempo: (x: number) => dispatch(setTempoBpm(x)),
        });
      } else {
        const isFullStringScalePlayback = playbackType === fullStringScaleType;
        dispatchAlert(
          `${getNoteText(baseNote)} ${scale} ${
            isFullStringScalePlayback ? " (full string)" : ""
          }`
        );

        const { playWholeScale } = await import(
          "@/app/engine/play/scalePlayer"
        );
        await playWholeScale(waitForNextTick, neck, isFullStringScalePlayback);
      }
    } finally {
      dispatch(setIsPlaying(false));
    }
  }, [
    baseNote,
    chordInstrument,
    dispatch,
    instrument,
    neck,
    onPlayExample,
    playbackType,
    reverbStrength,
    scale,
    scaleGroup,
    tuning,
  ]);

  useEffect(() => {
    // stop playing when any of dependencies changes
    dispatch(setIsPlaying(false));
  }, [neck, tuning, baseNote, scale, playbackType, dispatch]);

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
