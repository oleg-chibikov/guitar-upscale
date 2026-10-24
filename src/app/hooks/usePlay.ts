import { TICKS_IN_BAR } from "@/app/data/clockConstants";
import { EventsByTick } from "@/app/engine/eventsByTick";
import { checkLooperPlaying } from "@/app/engine/looper/looperShared";
import {
  pianoRollData,
  setPianoRollData,
} from "@/app/engine/pianoRoll/pianoRollState";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { Dispatch, useCallback, useEffect, useRef, useState } from "react";
import ReactGA from "react-ga4";
import { useDispatch } from "react-redux";
import { UnknownAction } from "redux";
import { AlertType } from "../data/alertType";
import {
  Example,
  RANDOM_SONG,
  SongChoice,
  getExampleName,
} from "../data/example";
import { getNoteText } from "../data/notes";
import { PlaybackType } from "../data/playbackType";
import { loadInstrument } from "../engine/sound/soundHelper";
import {
  capoValue,
  clearWipeExampleCacheTrigger,
  isPlayingValue,
  playbackTypeValue,
  reverbStrengthValue,
  scaleGroupValue,
  scaleValue,
  setIsPlaying,
  setNowPlaying,
  setTempoBpm,
  tempoBpmValue,
  wipeExampleCacheTriggerValue,
} from "../store/settingsSlice";
import { setAndShowAlert } from "../store/uiSlice";

// TODO: First note is played shifted often! see billie jean
const melodyType = PlaybackType.Melody;
const fullStringScaleType = PlaybackType.FullStringScale;
const LOG_PREFIX = "usePlay: ";

export interface UsePlayParams {
  decodeExample?: (example: Example) => Promise<EventsByTick>;
}

export const usePlay = ({ decodeExample }: UsePlayParams) => {
  const guitarSettingsUpdateCount = useSettingsSelector(
    (s) => s.guitarSettingsUpdateCount,
  );
  const isPlaying = useSettingsSelector((s) => s.isPlaying);
  const playbackType = useSettingsSelector((s) => s.playbackType);
  const [isWaiting, setIsWaiting] = useState(false);
  // Play repeats the last song until the scale or the playback type changes
  const settingsKey = `${guitarSettingsUpdateCount}:${playbackType}`;
  const [lastPlayed, setLastPlayed] = useState<{
    example: Example;
    settingsKey: string;
  }>();
  const repeatable =
    lastPlayed?.settingsKey === settingsKey ? lastPlayed.example : undefined;

  // a ref is updated along with the state. It's needed to immediately mark playback as active and therefore prevent any double playback if clicked simultaneously
  const isWaitingRef = useRef<boolean>(false);

  const updateWaiting = (value: boolean) => {
    setIsWaiting(value);
    isWaitingRef.current = value;
  };

  const dispatch = useDispatch();

  const handlePlay = useCallback(
    async (choice?: SongChoice) => {
      if (isWaitingRef.current) {
        console.log(
          LOG_PREFIX +
            "Already waiting for playback to start, skipping new request",
        );
        return;
      }
      updateWaiting(true);
      try {
        if (choice !== undefined && isPlayingValue && !checkLooperPlaying()) {
          await stop(dispatch);
        }

        if (isPlayingValue) {
          if (checkLooperPlaying()) {
            await continueLooper();
            return;
          }

          if (pianoRollData) {
            updateWaiting(false);
            await replay(
              dispatch,
              pianoRollData,
              repeatable?.decodedTracks === pianoRollData
                ? getExampleName(repeatable)
                : undefined,
            );
            return;
          }
          return;
        }

        console.log(LOG_PREFIX, "Loading examples");
        const example: Example | undefined = await loadExample(
          decodeExample,
          dispatch,
          choice === RANDOM_SONG ? undefined : (choice ?? repeatable),
        );
        setLastPlayed(example && { example, settingsKey });

        await loadInstruments(example);

        const {
          eventsByTick,
          message,
        }: { eventsByTick: EventsByTick; message: string } = await decode(
          decodeExample,
          example,
        );

        if (!eventsByTick.hasItems) {
          return;
        }

        await playExampleOrScale(
          example,
          dispatch,
          message,
          eventsByTick,
          updateWaiting,
        );
      } finally {
        updateWaiting(false);
      }
    },
    [dispatch, decodeExample, repeatable, settingsKey],
  );

  useEffect(() => {
    // stop playing when any of dependencies changes
    dispatch(setIsPlaying(false));
    setPianoRollData(undefined, dispatch);
  }, [guitarSettingsUpdateCount, dispatch]);

  useEffect(() => {
    const handleKeyPress = async (event: KeyboardEvent) => {
      // the piano roll takes Space for its own playback and marks it handled
      if (event.code === "Space" && !event.defaultPrevented) {
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

  return {
    isWaiting,
    handlePlay,
    isPlaying,
    canPlayAgain: repeatable !== undefined,
  };
};

async function replay(
  dispatch: Dispatch<UnknownAction>,
  data: EventsByTick,
  songName: string | undefined,
) {
  console.log("Replaying");
  const { playMidi } = await import("@/app/engine/midiPlayer");
  await playMidi(dispatch, data, LOG_PREFIX, () =>
    dispatch(setNowPlaying(songName)),
  );
}

async function stop(dispatch: Dispatch<UnknownAction>) {
  setPianoRollData(undefined, dispatch);
  const { stopPlayback } = await import("@/app/engine/midiPlayer");
  await stopPlayback(dispatch, LOG_PREFIX);
}

async function continueLooper() {
  console.log(LOG_PREFIX + "Stopping looper playback");
  const { stopLooperPlayback } = await import("@/app/engine/looper/looper");
  stopLooperPlayback();
}

async function playExampleOrScale(
  example: Example | undefined,
  dispatch: Dispatch<UnknownAction>,
  message: string,
  eventsByTick: EventsByTick,
  updateWaiting: (value: boolean) => void,
) {
  // Start playback
  console.log(LOG_PREFIX + "Waiting for playback to start...");
  const { playMidi } = await import("@/app/engine/midiPlayer");
  await playMidi(
    dispatch,
    eventsByTick,
    LOG_PREFIX,
    () => {
      console.log(LOG_PREFIX + "Start playing");
      ReactGA.event({
        category: "Playback",
        action: "Playback started",
      });

      dispatch(
        example
          ? setNowPlaying(message)
          : setAndShowAlert({ message, alertType: AlertType.Success }),
      );

      // remove the waiting mark only after the playback has started. If it's done earlier - race conditions are possible
      console.log(
        LOG_PREFIX + "The playback has started. Removing the waiting mark",
      );

      updateWaiting(false);
    },
    getStartBarPosition(example),
  );
}

async function loadInstruments(example: Example | undefined) {
  // the instrument should be initialized before waiting for the first note
  // init metronome here as we don't want to get glitches if it gets turned on during playing
  const trackInstrumentPromises =
    example?.song?.tracks.map((track) =>
      track.instrument !== undefined
        ? loadInstrument(track.instrument, reverbStrengthValue)
        : Promise.resolve(),
    ) ?? [];

  await Promise.all(trackInstrumentPromises);
}

async function loadExample(
  decodeExample: ((example: Example) => Promise<EventsByTick>) | undefined,
  dispatch: Dispatch<UnknownAction>,
  chosen?: Example,
) {
  let example: Example | undefined;
  if (decodeExample && playbackTypeValue === melodyType) {
    const { getScaleExample, wipeExamplesCache } =
      await import("@/app/engine/songs/songLibrary");
    if (wipeExampleCacheTriggerValue) {
      wipeExamplesCache();
      clearWipeExampleCacheTrigger();
    }
    example = await getScaleExample(scaleGroupValue, scaleValue, chosen);
    const tempo = example?.song?.tempo;
    if (tempo !== undefined && tempo !== tempoBpmValue) {
      dispatch(setTempoBpm({ tempo: tempo, updateInterval: true }));
    }
  } else {
    await import("@/app/engine/decoders/scaleDecoder");
  }
  return example;
}

function getStartBarPosition(example: Example | undefined) {
  const pickupTicks = (example?.song?.pickupTicks ?? 0) % TICKS_IN_BAR;
  // a song with a pickup bar starts that many ticks before the bar
  return (TICKS_IN_BAR - pickupTicks) % TICKS_IN_BAR;
}

async function decode(
  decodeExample: ((example: Example) => Promise<EventsByTick>) | undefined,
  example: Example | undefined,
) {
  let eventsByTick: EventsByTick;
  let message: string;
  if (decodeExample && example && playbackTypeValue === melodyType) {
    // this sets decoded melody in the example
    eventsByTick = await decodeExample(example);
    message = getExampleName(example);
  } else {
    const isFullStringScalePlayback = playbackTypeValue === fullStringScaleType;
    message = `${getNoteText(capoValue)} ${scaleValue} ${
      isFullStringScalePlayback ? " (full string)" : ""
    }`;

    const { getWholeScale } =
      await import("@/app/engine/decoders/scaleDecoder");
    eventsByTick = getWholeScale(isFullStringScalePlayback);
  }
  return { eventsByTick, message };
}
