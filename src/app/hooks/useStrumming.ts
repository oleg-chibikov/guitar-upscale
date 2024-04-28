import { useCallback, useRef, useState } from "react";
import { ChordStrummingInterval } from "../data/chordStrummingInterval";
import {
  isMainClockTicking,
  waitForNextBeat,
  waitForNextHalfBeat,
  waitForNextQuarterBeat,
  waitForNextTick,
} from "../engine/mainClock";
import {
  chordCustomStrummingPatternValue,
  chordCustomStrummingWaitForPatternFinishValue,
  chordStrummingIntervalValue,
  setIsStrumming,
  useChordAlterationValue,
} from "../store/settingsSlice";

const getWaitBetweenFunc = () => {
  switch (chordStrummingIntervalValue) {
    case ChordStrummingInterval.Beat:
      return waitForNextBeat;
    case ChordStrummingInterval.HalfBeat:
      return waitForNextHalfBeat;
    case ChordStrummingInterval.QuarterBeat:
      return waitForNextQuarterBeat;
    default:
      return waitForNextTick;
  }
};

export const useStrumming = (
  chordName: string,
  play: () => void,
  isDisabled: boolean,
  hasTouchInput: boolean
) => {
  const [isClicked, setIsClicked] = useState<boolean>();
  const [isPlaying, setIsPlaying] = useState<boolean>();
  const isClickedRef = useRef<boolean>(false);
  const isPlayingRef = useRef<boolean>(false);
  const isAlternateRef = useRef<boolean>(false);

  const playWithPossibleAlteration = useCallback(() => {
    console.log("Playing", chordName);
    play();
    if (useChordAlterationValue) {
      isAlternateRef.current = !isAlternateRef.current;
    }
  }, [chordName, play]);

  const handleClickOutside = (event: MouseEvent | TouchEvent) => {
    console.log("Clicked outside", chordName);
    if (!isClickedRef.current || isDisabled) {
      console.log("Chord not clicked yet - ignoring", chordName);
      return;
    }
    let target = event.target as Node | null;
    let clickIgnored = false;

    while (target && target !== document) {
      const id = (target as HTMLElement)?.id;
      // keep playing chord when clicking notes simultaneously
      if (id === "fretboard") {
        clickIgnored = true;
        break;
      }
      target = target.parentNode;
    }

    if (clickIgnored) {
      console.log("Clicked on fretboard - ignoring", chordName);
      return;
    }

    if (!isPlayingRef.current) {
      console.log(
        "Not playing when clicked outside - stop strumming",
        chordName
      );
      // stop ticking if not yet playing - otherwise wait for the pattern to finish - it will stop ticking itself
      setIsStrumming(chordName, false);
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
  };

  const startStrumming = async () => {
    if (isDisabled) {
      return;
    }

    setClicked(true);

    if (isPlayingRef.current) {
      // Avoid starting new strumming the same chord while it is still playing.
      // Please note that setClicked should be set to true before returning to repeat the previous strumming
      // Without that it would double
      return;
    }

    !hasTouchInput && document.addEventListener("mouseup", handleClickOutside);
    hasTouchInput && document.addEventListener("touchend", handleClickOutside);
    try {
      const wasClockTickingAtStrummingStart = isMainClockTicking();

      if (isClickedRef.current) {
        console.log("Mark as strumming", chordName);
        setIsStrumming(chordName, true);
      } else {
        console.log(
          "Already released mouse/touch after immediate chord. Don't start strumming",
          chordName
        );
        return;
      }

      if (!wasClockTickingAtStrummingStart) {
        // Play first chord straight away
        playWithPossibleAlteration();
      }

      const waitBetween = getWaitBetweenFunc();

      if (wasClockTickingAtStrummingStart) {
        // TODO: We need to wait for the current pattern to finish - it might be something other than next beat if pattern is longer or chord interval is not a Tick
        // for that we'll need to store
        // 1. current pattern (done)
        // 2. tick when the current pattern started - to get the difference for waiting
        // 3. info if the pattern has been started - if not - just wait for beat as now (semi done)

        // TODO: If there is NO strumming currently - play the pattern from the next tick (but not from the beginning - see how much needed to skip)
        console.log("Waiting for next beat for strumming to begin", chordName);
        await waitForNextBeat();
      } else {
        console.log("Waiting for next tick for strumming to begin", chordName);
        await waitBetween();
      }

      if (!isClickedRef.current) {
        console.log(
          "Already released mouse/touch after wait. Stop strumming and return",
          chordName
        );
        setIsStrumming(chordName, false);
        return;
      }

      console.log("Starting strumming", chordName);
      setPlaying(true);
      try {
        // skip first chord if it was played immediately
        await strum(wasClockTickingAtStrummingStart ? 0 : 1, waitBetween);
      } finally {
        console.log("Strum finished - stop strumming", chordName);
        setPlaying(false);
        setIsStrumming(chordName, false); // don't stop ticking if there is another chord playing
      }
    } finally {
      !hasTouchInput &&
        document.removeEventListener("mouseup", handleClickOutside);
      hasTouchInput &&
        document.removeEventListener("touchend", handleClickOutside);
    }
  };

  const strum = async (
    startIndex: number,
    waitBetweenChords: () => Promise<void>
  ) => {
    let i = startIndex; // skip first as it was played already
    while (isClickedRef.current) {
      const currentPattern = chordCustomStrummingPatternValue;

      for (; i < currentPattern.length; i++) {
        const char = currentPattern[i];
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
        await waitBetweenChords();
      }
      i = 0; // reset  to start pattern afresh
    }
  };

  return { startStrumming, isPlaying, isClicked, isAlternateRef };
};
