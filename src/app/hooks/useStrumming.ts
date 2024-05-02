import { useCallback, useRef, useState } from "react";
import { ChordStrummingInterval } from "../data/chordStrummingInterval";
import { ChordEventBus } from "../engine/eventBus";
import {
  isMainClockActive,
  waitForNextBar,
  waitForNextBeat,
  waitForNextHalfBar,
  waitForNextHalfBeat,
  waitForNextTick,
} from "../engine/mainClock";
import {
  areOtherChordsStrumming,
  currentChord,
  finishChordGracePeriod,
  getChordClickedPromise,
  getOtherChordsGracePeriodPromises,
  getOtherChordsStrummingPromises,
  isChordClicked,
  isChordPlaying,
  isThisChordStrummingOrPendingStrumming,
  markChordAsPendingStrumming,
  markChordAsStrumming,
  registerChordClick,
  releaseChordClick,
  startChordGracePeriod,
} from "../engine/strummingState";
import { asyncTimeout } from "../helpers/asyncTimeout";
import {
  chordCustomStrummingPatternValue,
  chordCustomStrummingWaitForPatternFinishValue,
  chordStrummingIntervalValue,
  isAnyTimerSpecificActivityRunning,
  seamlessChordSwitchingValue,
  useChordAlterationValue,
} from "../store/settingsSlice";

const GRACE_INTERVALS = 2;

const getWaitBetweenFunc = () => {
  switch (chordStrummingIntervalValue) {
    case ChordStrummingInterval.Bar:
      return waitForNextBar;
    case ChordStrummingInterval.HalfBar:
      return waitForNextHalfBar;
    case ChordStrummingInterval.Beat:
      return waitForNextBeat;
    case ChordStrummingInterval.HalfBeat:
      return waitForNextHalfBeat;
    default:
      return waitForNextTick;
  }
};

export const useStrumming = (
  chordName: string,
  isDisabled: boolean,
  hasTouchInput: boolean
) => {
  const [isClicked, setIsClicked] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGracePeriod, setIsGracePeriod] = useState<boolean>(false);
  const isAlternateRef = useRef<boolean>(false);

  const play = useCallback(
    (isPlayedWithinGracePeriod: boolean) => {
      const chordToPlay =
        (seamlessChordSwitchingValue || isPlayedWithinGracePeriod) &&
        currentChord
          ? currentChord
          : chordName;
      // Using currentChord here is needed for seamless switching between chords while playing the strumming pattern
      ChordEventBus.next({ chord: chordToPlay, metadata: {} });
    },
    [chordName]
  );

  const playWithPossibleAlteration = useCallback(() => {
    console.log("Playing", chordName);
    play(false);
    if (useChordAlterationValue) {
      isAlternateRef.current = !isAlternateRef.current;
    }
  }, [chordName, play]);

  const handlePressReleased = (event: MouseEvent | TouchEvent) => {
    console.log("Chord press released", chordName);
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
    if (value) {
      markChordAsStrumming(chordName);
    } else {
      finishChordGracePeriod(chordName);
      setIsGracePeriod(false);
    }
    setIsPlaying(value);
  };

  const onChordPress = async () => {
    if (isDisabled) {
      return;
    }

    console.log("Pressed chord", chordName);
    setClicked(true);

    console.log("Registering mouseup/touchend", chordName);
    !hasTouchInput && document.addEventListener("mouseup", handlePressReleased);
    hasTouchInput && document.addEventListener("touchend", handlePressReleased);

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
      const wasClockActiveWhenChordPressed = isMainClockActive();

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

      if (!wasClockActiveWhenChordPressed) {
        // Play first chord straight away
        playWithPossibleAlteration();
      } else {
        // if clock is active - verify that it's a long press (and if not - play immediately)
        setTimeout(() => {
          if (!isChordClicked(chordName)) {
            playWithPossibleAlteration();
          }
        }, 125);
      }
      const wasStrummingWhenChordPressed = areOtherChordsStrumming(chordName);
      const otherChordsStrummingPromises =
        getOtherChordsStrummingPromises(chordName);
      const otherChordsGracePeriodPromises =
        getOtherChordsGracePeriodPromises(chordName);

      const waitBetween = getWaitBetweenFunc();

      const isOtherChordStrumming = otherChordsStrummingPromises.length > 0;
      const clickedInOtherChordGracePeriod =
        otherChordsGracePeriodPromises.length > 0;

      const waitAndStrum = async () => {
        let intervalsToSkip = clickedInOtherChordGracePeriod
          ? GRACE_INTERVALS
          : 0;
        let initialWait: () => Promise<void | void[]>;
        if (wasClockActiveWhenChordPressed) {
          console.log("Clock was active when clicked", chordName);

          if (clickedInOtherChordGracePeriod) {
            console.log(
              "WAITING - Clicked in grace period. Waiting for it to finish to start strumming",
              chordName
            );
            initialWait = () => Promise.all(otherChordsGracePeriodPromises);
          } else if (isOtherChordStrumming) {
            // TODO: If there is NO strumming currently - play the pattern from the next beat (but not from the beginning - see how much needed to skip)

            console.log(
              "WAITING - Waiting for current strumming pattern to finish before beginning strumming new chord",
              chordName
            );
            initialWait = () => Promise.all(otherChordsStrummingPromises);
          } else if (wasStrummingWhenChordPressed) {
            console.log(
              "WAITING - Strumming not over - waiting for the next interval to strum",
              chordName
            );
            initialWait = waitBetween;
          } else if (
            isAnyTimerSpecificActivityRunning() &&
            !isOtherChordStrumming
          ) {
            console.log(
              "WAITING - Metronome/play/recording active but no strumming - waiting for the next bar to strum",
              chordName
            );
            initialWait = waitForNextBar;
          } else {
            console.log(
              "WAITING - Clock active but the only activity is strumming from this chord - waiting for the next interval to strum",
              chordName
            );
            initialWait = waitBetween;
          }
        } else {
          console.log(
            "WAITING - Clock not active - waiting for the next interval to strum",
            chordName
          );
          initialWait = waitBetween;
        }

        const currentClickPromise = getChordClickedPromise(chordName);
        // either wait for the current strumming to become pending finishing or if nothing is strumming - then for the next interval (or bar if clock is active)
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
        // skip first chord if it was played immediately
        await strum(
          intervalsToSkip,
          waitBetween,
          clickedInOtherChordGracePeriod
        );
      };

      if (!isChordPlaying(chordName) && !wasStrummingWhenChordPressed) {
        // Add small timeout in order to allow single click chords. There should be enough time to release the mouse even if clicked very close to the bar
        // this time should be as little as needed for a click/tap
        await asyncTimeout(waitAndStrum, 100);
      } else {
        // if currently strumming there is usually no need to play additional chords, so it's better to not add additional wait time - it's good for smoother switch between strumming chords
        await waitAndStrum();
      }
    } finally {
      console.log("Unregistering mouseup/touchend", chordName);
      !hasTouchInput &&
        document.removeEventListener("mouseup", handlePressReleased);
      hasTouchInput &&
        document.removeEventListener("touchend", handlePressReleased);
    }
  };

  const strum = async (
    startIndex: number,
    waitBetweenChords: () => Promise<void>,
    clickedInGracePeriod: boolean
  ): Promise<void> => {
    console.log("----> Started actual strumming", chordName);
    setPlaying(true);
    try {
      let currentIndex = startIndex; // skip first as it was played already
      const currentPattern = chordCustomStrummingPatternValue;

      const playChordOnce = async () => {
        const char = currentPattern[currentIndex];
        switch (char) {
          case "↑":
            isAlternateRef.current = false;
            play(clickedInGracePeriod);
            break;
          case "↓":
            isAlternateRef.current = true;
            play(clickedInGracePeriod);
            break;
          case "_":
            break;
        }

        await waitBetweenChords();
      };

      while (isChordClicked(chordName)) {
        const currentPattern = chordCustomStrummingPatternValue;

        for (; currentIndex < currentPattern.length; currentIndex++) {
          if (!chordCustomStrummingWaitForPatternFinishValue) {
            // early break pattern only when the checkbox is off
            if (!isChordClicked(chordName)) {
              // already released mouse/touch - don't play the strumming
              return;
            }
          }
          await playChordOnce();
        }
        currentIndex = 0; // reset to start pattern afresh
      }

      if (chordCustomStrummingWaitForPatternFinishValue) {
        setIsGracePeriod(true);
        startChordGracePeriod(chordName);
        // Wait GRACE_INTERVALS intervals - This gives additional opportunity to press another chord and repeat the pattern
        if (!areOtherChordsStrumming(chordName)) {
          console.log(
            "Other chords are not strumming - play grace chords",
            chordName
          );
          await playChordOnce(); // play first chord once every time during grace period

          for (let i = 1; i < GRACE_INTERVALS; i++) {
            if (areOtherChordsStrumming(chordName)) {
              await playChordOnce(); // play subsequent chords only if there are other chords pending, otherwise just wait for grace period end
            } else {
              await waitBetweenChords();
            }
            currentIndex++;
            if (currentIndex == currentPattern.length) {
              currentIndex = 0;
            }
          }
        }
      }
    } finally {
      console.log("Strumming finished - setting isPlaying to false", chordName);
      setPlaying(false);
    }
  };

  return { onChordPress, isPlaying, isClicked, isGracePeriod, isAlternateRef };
};
