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
  areOtherChordsStrumming,
  finishStrumming,
  getChordClickedPromise,
  getOtherStrummingChordPromises,
  isChordClicked,
  isChordPlaying,
  isThisChordStrummingOrPendingStrumming,
  markChordAsPendingStrumming,
  markChordAsPendingStrummingFinishing,
  markChordAsStrumming,
  registerChordClick,
  releaseChordClick,
} from "../engine/strummingState";
import { asyncTimeout } from "../helpers/asyncTimeout";
import {
  chordCustomStrummingPatternValue,
  chordCustomStrummingWaitForPatternFinishValue,
  chordStrummingIntervalValue,
  isMetronomeTickingValue,
  isPlayingValue,
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
  const [isClicked, setIsClicked] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGracePeriod, setIsGracePeriod] = useState<boolean>(false);
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
    if (!isChordClicked(chordName) || isDisabled) {
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

    if (!isChordPlaying(chordName)) {
      console.log(
        "Not playing when clicked outside - stop strumming",
        chordName
      );

      // release clicked promise before removing chord data
      setClicked(false);
      // stop ticking if not yet playing - otherwise wait for the pattern to finish - it will stop ticking itself
      setPlaying(false);

      if (isMainClockTicking() && !areOtherChordsStrumming(chordName)) {
        console.log(
          "Releasing button before started playing but timer is on - play the chord now as it was not played immediately"
        );
        playWithPossibleAlteration();
      }
    } else {
      setClicked(false);
    }
  };

  const setClicked = (value: boolean) => {
    setIsClicked(value);
    if (value) {
      registerChordClick(chordName);
    } else {
      releaseChordClick(chordName);
    }
  };

  const setPlaying = (value: boolean) => {
    setIsPlaying(value);
    if (value) {
      markChordAsStrumming(chordName);
    } else {
      finishStrumming(chordName);
    }
  };

  const onChordPress = async () => {
    if (isDisabled) {
      return;
    }

    console.log("Pressed chord", chordName);
    setClicked(true);

    console.log("Registering mouseup/touchend", chordName);
    !hasTouchInput && document.addEventListener("mouseup", handleClickOutside);
    hasTouchInput && document.addEventListener("touchend", handleClickOutside);

    if (isThisChordStrummingOrPendingStrumming(chordName)) {
      console.log(
        "This chord is already strumming or pending strumming, ignoring",
        chordName
      );
      // Avoid starting new strumming the same chord while it is still playing.
      // Please note that setClicked should be set to true before returning to repeat the previous strumming
      // Without that it would double
      return;
    }

    try {
      const wasClockTickingWhenChordPressed = isMainClockTicking();

      if (isChordClicked(chordName)) {
        console.log("Mark as strumming", chordName);
        markChordAsPendingStrumming(chordName);
      } else {
        console.log(
          "Already released mouse/touch after immediate chord. Don't start strumming",
          chordName
        );
        return;
      }

      if (!wasClockTickingWhenChordPressed) {
        // Play first chord straight away
        playWithPossibleAlteration();
      }
      const wasStrummingWhenChordPressed = areOtherChordsStrumming(chordName);
      const otherStrummingPromises = getOtherStrummingChordPromises(chordName);
      const waitBetween = getWaitBetweenFunc();

      let clickedInGracePeriod =
        wasStrummingWhenChordPressed && !otherStrummingPromises.length; //TODO: get promises for OTHER chords (except this one)
      console.log("Is in grace period", chordName, clickedInGracePeriod);

      const waitAndStrum = async () => {
        let intervalsToSkip = clickedInGracePeriod ? 1 : 0;
        let initialWait: () => Promise<void | void[]>;
        if (wasClockTickingWhenChordPressed) {
          console.log("Clock was ticking when clicked", chordName);

          // TODO: If there is NO strumming currently - play the pattern from the next tick (but not from the beginning - see how much needed to skip)

          if (otherStrummingPromises.length) {
            console.log(
              "Waiting for current strumming pattern to finish before beginning strumming new chord",
              chordName
            );
            initialWait = () => Promise.all(otherStrummingPromises);
          } else {
            if (wasStrummingWhenChordPressed) {
              console.log(
                "Strumming not over - waiting for the next interval to strum",
                chordName
              );
              initialWait = waitBetween;
            } else if (isMetronomeTickingValue || isPlayingValue) {
              console.log(
                "Metronome/play active but no strumming - waiting for the next beat to strum",
                chordName
              );
              initialWait = waitForNextBeat;
            } else {
              console.log(
                "Clock ticking but the only activity is strumming from this chord - waiting for the next interval to strum",
                chordName
              );
              initialWait = waitBetween;
            }
          }
        } else {
          intervalsToSkip = 1; // already played it immediately
          console.log(
            "Clock not ticking - waiting for next interval to strum",
            chordName
          );
          initialWait = waitBetween;
        }

        const currentClickPromise = getChordClickedPromise(chordName);
        // either wait for the current strumming to become pending finishing or if nothing is strumming - then for the next interval (or beat if clock is ticking)
        const waitForAny = [initialWait()];
        // click might get released before the actual wait time - in this case we need to release the wait and stop processing this event
        if (currentClickPromise) {
          waitForAny.push(currentClickPromise);
        }

        await Promise.any(waitForAny);

        if (!isChordClicked(chordName)) {
          console.log(
            "Already released mouse/touch after wait. Stop strumming and don't continue",
            chordName
          );
          setPlaying(false);
          return;
        }
        try {
          // skip first chord if it was played immediately
          await strum(intervalsToSkip, waitBetween);
        } finally {
          console.log(
            "Strumming finished - setting isPlaying to false",
            chordName
          );
          setPlaying(false);
        }
      };

      if (!isChordPlaying(chordName) && !wasStrummingWhenChordPressed) {
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
    console.log("----> Started actual strumming", chordName);
    setPlaying(true);
    let i = startIndex; // skip first as it was played already
    while (isChordClicked(chordName)) {
      const currentPattern = chordCustomStrummingPatternValue;

      for (; i < currentPattern.length; i++) {
        const char = currentPattern[i];
        if (!chordCustomStrummingWaitForPatternFinishValue) {
          // early break pattern only when the checkbox is off
          if (!isChordClicked(chordName)) {
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

    markChordAsPendingStrummingFinishing(chordName);
    if (!areOtherChordsStrumming(chordName)) {
      console.log(
        "Other chords are not strumming - playing one chord at the end of the pattern to avoid off beat",
        chordName
      );
      play();
    }
    // This gives additional opportunity to press another chord and repeat the pattern
    await waitBetweenChords();
  };

  return { onChordPress, isPlaying, isClicked, isGracePeriod, isAlternateRef };
};
