import { useCallback, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { ChordStrummingMode } from "../data/chordStrummingMode";
import {
  isIntervalSet,
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
  reverbStrengthValue,
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

  const wait = async () => {
    if (isIntervalSet()) {
      // wait to sync with metronome/melody if playing, otherwise start straight away
      const waitFunc = chordCustomStrummingWaitForPatternFinishValue
        ? waitForNextBeat
        : waitForNextTick;
      await waitFunc();
    }
  };

  const strumCustom = async () => {
    await wait();

    try {
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
    } finally {
      setPlaying(false);
    }
  };

  const strumStandard = async (waitBetweenChords: () => Promise<void>) => {
    await wait();
    if (!isClickedRef.current) {
      // already released mouse/touch - don't play the strumming
      return;
    }
    setPlaying(true);
    try {
      while (isClickedRef.current) {
        playWithPossibleAlteration();
        await waitBetweenChords();
      }
    } finally {
      setPlaying(false);
    }
  };

  const startStrumming = async () => {
    //TODO: play first chord immediately on mousedown, only then wait to continue

    if (isDisabled) {
      return;
    }

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
        if (chordStrummingModeValue === ChordStrummingMode.Custom) {
          await strumCustom();
          return;
        }
        // timeout is needed to avoid strumming when the intention is to play single chord (happens in rare case when click is very close to the beat time - easy to rerpoduce on high bpm)
        let waitBetweenChords: () => Promise<void>;
        switch (chordStrummingModeValue) {
          case ChordStrummingMode.Beat:
            waitBetweenChords = waitForNextBeat;
            break;
          case ChordStrummingMode.HalfBeat:
            waitBetweenChords = waitForNextHalfBeat;
            break;
          case ChordStrummingMode.QuarterBeat:
            waitBetweenChords = waitForNextQuarterBeat;
            break;
          default:
            waitBetweenChords = waitForNextTick;
        }
        await strumStandard(waitBetweenChords);
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
