import { useCallback, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { ChordStrummingMode } from "../data/chordStrummingMode";
import {
  waitForNextBeat,
  waitForNextHalfBeat,
  waitForNextQuarterBeat,
  waitForNextTick,
} from "../engine/mainClock";
import { initMetronome } from "../engine/sound/metronomeProvider";
import { initSoundfont } from "../engine/sound/soundHelper";
import {
  chordCustomStrummingPatternValue,
  chordCustomStrummingWaitForPatternFinishValue,
  chordInstrumentValue,
  chordStrummingModeValue,
  isMetronomeTickingValue,
  isStrummingValue,
  reverbStrengthValue,
  setIsMetronomeTicking,
  setIsStrumming,
  useChordAlterationValue,
} from "../store/settingsSlice";

export const useStrumming = (
  play: () => void,
  isDisabled: boolean,
  hasTouchInput: boolean
) => {
  const [isClicked, setIsClicked] = useState<boolean>();
  const [isPlaying, setIsPlaying] = useState<boolean>();
  const isClickedRef = useRef<boolean>(false);
  const isPlayingRef = useRef<boolean>(false);
  const isAlternateRef = useRef<boolean>(false);

  const wasMetronomeTickingInitially = useRef(isMetronomeTickingValue);

  const dispatch = useDispatch();

  const playWithPossibleAlteration = useCallback(() => {
    play();
    if (useChordAlterationValue) {
      isAlternateRef.current = !isAlternateRef.current;
    }
  }, [play]);

  const handleClickOutside = (event: MouseEvent | TouchEvent) => {
    if (!isClickedRef.current || isDisabled) {
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
    while (isClickedRef.current) {
      playWithPossibleAlteration();
      await wait();
    }
    setPlaying(false);
  };

  const startStrumming = async () => {
    if (isDisabled) {
      return;
    }

    wasMetronomeTickingInitially.current = isMetronomeTickingValue; // remember if the metronome was ticking at the moment of chord play start. It's used to decide if we need to stop the metronome when the wait time before starting strumming is over
    setClicked(true);

    !hasTouchInput && document.addEventListener("mouseup", handleClickOutside);
    hasTouchInput && document.addEventListener("touchend", handleClickOutside);

    await Promise.all([
      initSoundfont(chordInstrumentValue, reverbStrengthValue),
      initMetronome(),
    ]);

    setTimeout(async () => {
      try {
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
            await strumCustom();
            return;
          }
          default:
            wait = waitForNextTick;
        }
        await strumStandard(wait);
      } finally {
        !hasTouchInput &&
          document.removeEventListener("mouseup", handleClickOutside);
        hasTouchInput &&
          document.removeEventListener("touchend", handleClickOutside);
      }
    }, 250);
  };

  return { startStrumming, isPlaying, isClicked, isAlternateRef };
};
