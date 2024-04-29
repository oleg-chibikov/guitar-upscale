import { useCallback, useRef, useState } from "react";
import { ChordStrummingInterval } from "../data/chordStrummingInterval";
import {
  isMainClockTicking,
  waitForNextBeat,
  waitForNextHalfBeat,
  waitForNextQuarterBeat,
  waitForNextTick,
} from "../engine/mainClock";
import { asyncTimeout } from "../helpers/asyncTimeout";
import {
  chordCustomStrummingPatternValue,
  chordCustomStrummingWaitForPatternFinishValue,
  chordStrummingIntervalValue,
  setIsStrumming,
  useChordAlterationValue,
  waitForStrummingToFinish,
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
      if (isMainClockTicking()) {
        console.log(
          "Releasing button before started playing but timer is on - play the chord now as it was not played immediately"
        );
        playWithPossibleAlteration();
      }
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

    console.log("Registering mouseup/touchend", chordName);
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

      const waitAndStrum = async () => {
        const waitBetween = getWaitBetweenFunc();

        if (wasClockTickingAtStrummingStart) {
          // TODO: If there is NO strumming currently - play the pattern from the next tick (but not from the beginning - see how much needed to skip)
          console.log(
            "Waiting for next beat for strumming to begin",
            chordName
          );
          // either wait for the current strumming to finish or if nothing is strumming - then for the next beat
          const initialWait = waitForStrummingToFinish ?? waitForNextBeat;
          await initialWait();
        } else {
          console.log(
            "Waiting for next tick for strumming to begin",
            chordName
          );
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
      };

      if (!isPlayingRef.current) {
        // Add small timeout in order to allow single click chords. There should be enough time to release the mouse even if clicked very close to the beat
        // this time should be as little as needed for a click/tap
        await asyncTimeout(waitAndStrum, 100);
      } else {
        // if currently strumming there is usually no need to play additional chords, so it's better to not add additional wait time - it's good for smoother switch between strumming chords
        await waitAndStrum();
      }
    } finally {
      console.log("Unregistering mouseup/touchend", chordName);
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
