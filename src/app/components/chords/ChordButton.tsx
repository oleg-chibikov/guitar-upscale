import { ChordStrummingMode } from "@/app/data/chordStrummingMode";
import { Theme } from "@/app/data/theme";
import {
  waitForNextBeat,
  waitForNextHalfBeat,
  waitForNextQuarterBeat,
  waitForNextTick,
} from "@/app/engine/mainClock";
import { initMetronome } from "@/app/engine/sound/metronomeProvider";
import { initSoundfont } from "@/app/engine/sound/soundHelper";
import { selectUi } from "@/app/store/uiSlice";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ChordPlayMode } from "../../data/chordPlayMode";
import {
  ChordPlayParameters,
  playAllVariations,
  playClosestChordVariation,
  playFirstChordVariation,
  playRandomChordVariation,
  playRoundRobin,
} from "../../engine/chordPlayer";
import { NoteChordMode } from "../../engine/chordsGenerator";
import {
  ChordEventBus,
  ChordMetadata,
  ChordToChordButtonEventMap,
} from "../../engine/eventBus";
import { useInputChecker } from "../../helpers/useInputChecker";
import {
  chordCustomStrummingPatternValue,
  chordCustomStrummingWaitForPatternFinishValue,
  chordInstrumentValue,
  chordStrummingModeValue,
  isMetronomeTickingValue,
  isStrummingValue,
  reverbStrengthValue,
  selectSettings,
  setIsMetronomeTicking,
  setIsStrumming,
  useChordAlterationValue,
} from "../../store/settingsSlice";

interface ChordButtonProps {
  chordName: string;
  noteChordMode: NoteChordMode;
  isHidden: boolean;
}

export const ChordButton: React.FC<ChordButtonProps> = ({
  chordName,
  noteChordMode,
  isHidden,
}) => {
  const [isClicked, setIsClicked] = useState<boolean>();
  const [isPlaying, setIsPlaying] = useState<boolean>();
  const isClickedRef = useRef<boolean>(false);
  const isPlayingRef = useRef<boolean>(false);
  const isAlternateRef = useRef<boolean>(false);

  const wasMetronomeTickingInitially = useRef(isMetronomeTickingValue);

  const { chordPlayMode, chordStrummingDelayMs, chordNotesToPlay } =
    useSelector(selectSettings);

  const hasTouchInput = useInputChecker();

  const play = useCallback(() => {
    ChordEventBus.next({ chord: chordName, metadata: {} });
  }, [chordName]);

  const dispatch = useDispatch();

  const playWithPossibleAlteration = useCallback(() => {
    play();
    if (useChordAlterationValue) {
      isAlternateRef.current = !isAlternateRef.current;
    }
  }, [play]);

  useEffect(() => {
    // TODO: a single event handler for all the chords instead of a separate handler for every chord
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (!isClickedRef.current) {
        return;
      }
      let target = event.target as Node | null;
      let isInsideFretMarker = false;

      while (target && target !== document) {
        const id = (target as HTMLElement)?.id;
        // keep playing chord when clicking notes simultaneously
        if (id === "fret-header" || id === "fret-notes") {
          isInsideFretMarker = true;
          break;
        }
        target = target.parentNode;
      }

      if (isInsideFretMarker) {
        return;
      }

      if (!isPlayingRef.current) {
        // there was not enough time to start strumming - play chord immediately
        playWithPossibleAlteration();
      }
      setClicked(false);
      if (isMetronomeTickingValue && !wasMetronomeTickingInitially.current) {
        console.log(
          "Stopping metronome - unpressed the chord button",
          wasMetronomeTickingInitially.current
        );
        dispatch(setIsMetronomeTicking(false));
      }
    };

    !hasTouchInput && document.addEventListener("mouseup", handleClickOutside);
    hasTouchInput && document.addEventListener("touchend", handleClickOutside);

    return () => {
      !hasTouchInput &&
        document.removeEventListener("mouseup", handleClickOutside);
      hasTouchInput &&
        document.removeEventListener("touchend", handleClickOutside);
    };
  }, [chordName, dispatch, hasTouchInput, playWithPossibleAlteration]);

  const setClicked = (value: boolean) => {
    setIsClicked(value);
    isClickedRef.current = value;
  };

  const setPlaying = (value: boolean) => {
    setIsPlaying(value);
    isPlayingRef.current = value;
    dispatch(setIsStrumming(value));
  };

  const waitWithMetronome = async (wait: () => Promise<void>) => {
    setTimeout(() => {
      // timeout here removes metronome from single clicks. We start the metronome only after N ms after the click
      if (!isClickedRef.current) {
        return;
      }
      if (
        !wasMetronomeTickingInitially.current &&
        !isStrummingValue &&
        !isPlayingRef.current // make sure the strumming has not been started
      ) {
        console.log("Starting metronome for chord strumming wait time");
        dispatch(setIsMetronomeTicking(true));
      }
    }, 250);
    await wait();
    if (
      isMetronomeTickingValue &&
      !wasMetronomeTickingInitially.current &&
      isClickedRef.current
    ) {
      console.log("Stopping metronome - chord strumming wait time is over");
      dispatch(setIsMetronomeTicking(false));
    }
  };

  const strumCustom = async () => {
    await waitWithMetronome(
      chordCustomStrummingWaitForPatternFinishValue
        ? waitForNextBeat
        : waitForNextTick
    );

    setPlaying(true);
    while (isClickedRef.current) {
      const currentPattern = chordCustomStrummingPatternValue;

      for (const char of currentPattern) {
        if (!chordCustomStrummingWaitForPatternFinishValue) {
          // early break pattern only when the checkbox is off
          if (!isClickedRef.current) {
            // already released mouse/touch - don't play the strumming
            return;
          }
        }
        switch (char) {
          case "↑":
            isAlternateRef.current = false;
            play();
            break;
          case "↓":
            isAlternateRef.current = true;
            play();
            break;
          case "_":
            break;
        }
        await waitForNextTick();
      }
    }
    setPlaying(false);
  };

  const strumStandard = async (wait: () => Promise<void>) => {
    await waitWithMetronome(wait);
    if (!isClickedRef.current) {
      // already released mouse/touch - don't play the strumming
      return;
    }
    setPlaying(true);
    while (isPlayingRef.current) {
      playWithPossibleAlteration();
      await wait();
    }
    setPlaying(false);
  };

  const startStrumming = async () => {
    await Promise.all([
      initSoundfont(chordInstrumentValue, reverbStrengthValue),
      initMetronome(),
    ]);
    wasMetronomeTickingInitially.current = isMetronomeTickingValue; // remember if the metronome was ticking at the moment of chord play start. It's used to decide if we need to stop the metronome when the wait time before starting strumming is over
    setClicked(true);
    setTimeout(() => {
      // the chord button must be still pressed to start strumming
      if (!isClickedRef.current) {
        return;
      }
      // timeout is needed to avoid strumming when the intention is to play single chord (happens in rare case when click is very close to the beat time - easy to rerpoduce on high bpm)
      let wait: () => Promise<void>;
      switch (chordStrummingModeValue) {
        case ChordStrummingMode.Beat:
          wait = waitForNextBeat;
          break;
        case ChordStrummingMode.HalfBeat:
          wait = waitForNextHalfBeat;
          break;
        case ChordStrummingMode.QuarterBeat:
          wait = waitForNextQuarterBeat;
          break;
        case ChordStrummingMode.Custom: {
          strumCustom();
          return;
        }
        default:
          wait = waitForNextTick;
      }
      strumStandard(wait);
    }, 250);
  };

  const { theme } = useSelector(selectUi);
  const disabled = !noteChordMode.variations.length;
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    const handleChordEvent = async (metadata: ChordMetadata) => {
      if (disabled) {
        console.log("Chord not enabled: " + chordName);
        return;
      }
      console.log("Playing chord: " + chordName);

      // Start the animation sequence
      setPressed(true);
      setTimeout(() => setPressed(false), 150);

      const delayMs = metadata.strummingDelayMs ?? chordStrummingDelayMs;
      const params: ChordPlayParameters = {
        chordName,
        noteChordMode,
        delayMs,
        notesToPlay: metadata.notesToPlay ?? chordNotesToPlay,
        trackNumber: metadata.trackNumber,
        trackInstrument: metadata.trackInstrument,
        reverse: isAlternateRef.current,
      };

      switch (chordPlayMode) {
        case ChordPlayMode.Round_Robin:
          await playRoundRobin(params);
          break;
        case ChordPlayMode.All_Variations:
          await playAllVariations(params);
          break;
        case ChordPlayMode.First_Variation:
          await playFirstChordVariation(params);
          break;
        case ChordPlayMode.Closest_Variation:
          await playClosestChordVariation(params);
          break;
        case ChordPlayMode.Random_Variation:
          await playRandomChordVariation(params);
          break;
        default:
          break;
      }
    };

    ChordToChordButtonEventMap.set(chordName, handleChordEvent);

    return () => {
      ChordToChordButtonEventMap.delete(chordName);
    };
  }, [
    chordName,
    chordPlayMode,
    chordStrummingDelayMs,
    chordNotesToPlay,
    disabled,
    noteChordMode,
  ]);

  if (isHidden) {
    return null;
  }

  return (
    <ul
      onTouchStart={
        hasTouchInput
          ? () => {
              startStrumming();
            }
          : undefined
      }
      onMouseDown={
        !hasTouchInput
          ? () => {
              startStrumming();
            }
          : undefined
      }
      className={`text-center w-16 h-10 items-center justify-center content-center ${
        isPlaying
          ? theme === Theme.Light
            ? "border-border_accent_stronger-light"
            : "border-2 border-border_accent_stronger-dark"
          : isClicked
          ? theme === Theme.Light
            ? "border-2 border-border_accent-light"
            : "border-2 border-border_accent-dark"
          : undefined
      } ${
        disabled
          ? theme === Theme.Light
            ? "bg-disabled-light text-gray-500"
            : "bg-disabled-dark text-gray-500"
          : pressed
          ? `scale-50 ${
              theme === Theme.Light
                ? "bg-button_pressed-light"
                : "bg-button_pressed-dark"
            }`
          : `scale-100 ${
              isClicked && !isPlaying
                ? "cursor-progress"
                : isPlaying || (!disabled && !isClicked)
                ? " cursor-pointer"
                : undefined
            } ${theme === Theme.Light ? "bg-button-light" : "bg-button-dark"}`
      } font-mono select-none ${
        theme === Theme.Light ? "text-foreground-light" : "text-foreground-dark"
      } transition-transform transform origin-center`}
    >
      {chordName}
    </ul>
  );
};
