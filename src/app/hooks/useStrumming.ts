import { useCallback, useRef, useState } from "react";
import { ChordStrummingInterval } from "../data/chordStrummingInterval";
import { ChordEventBus } from "../engine/eventBus";
import {
  TICKS_IN_BAR,
  TICKS_IN_BEAT,
  TICKS_IN_HALF_BAR,
  TICKS_IN_HALF_BEAT,
  bpmToMilliseconds,
  getCurrentRelativeTick,
  isMainClockActive,
  waitForNextBar,
  waitForNextBeat,
  waitForNextHalfBar,
  waitForNextHalfBeat,
  waitForNextTick,
} from "../engine/mainClock";
import {
  STRUMMING_LOG_PREFIX,
  areOtherChordsStrumming,
  currentChord,
  finishChordGracePeriod,
  getChordClickedPromise,
  getOtherChordsGracePeriodPromises,
  getOtherChordsStrummingPromises,
  isChordClicked,
  isChordStrumming,
  isChordStrummingOrPendingStrumming,
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
  tempoBpmValue,
  useChordAlterationValue,
} from "../store/settingsSlice";

const GRACE_INTERVALS = 2;

enum PromiseType {
  PressReleased = 1,
  WaitTimeOver = 2,
}

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
  const clickNumberRef = useRef<number>(0);

  const play = useCallback(
    (isPlayedWithinGracePeriod: boolean) => {
      const chordToPlay =
        (seamlessChordSwitchingValue || isPlayedWithinGracePeriod) &&
        currentChord !== undefined
          ? currentChord
          : chordName;
      // Using currentChord here is needed for seamless switching between chords while playing the strumming pattern
      ChordEventBus.next({
        chord: chordToPlay,
        metadata: {},
      });
    },
    [chordName]
  );

  const onChordPress = async () => {
    const clickNumber = clickNumberRef.current++;
    if (isDisabled) {
      return;
    }

    const register = () => {
      console.log(
        STRUMMING_LOG_PREFIX + "Registering mouseup/touchend",
        chordName,
        clickNumber
      );
      !hasTouchInput &&
        document.addEventListener("mouseup", handlePressReleased, true);
      hasTouchInput &&
        document.addEventListener("touchend", handlePressReleased, true);
    };

    const unregister = () => {
      console.log(
        STRUMMING_LOG_PREFIX + "Unregistering mouseup/touchend",
        chordName,
        clickNumber
      );
      !hasTouchInput &&
        document.removeEventListener("mouseup", handlePressReleased);
      hasTouchInput &&
        document.removeEventListener("touchend", handlePressReleased);
    };

    const handlePressReleased = (event: MouseEvent | TouchEvent) => {
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
        console.log(
          STRUMMING_LOG_PREFIX +
            "Clicked on fretboard - ignoring press release",
          chordName,
          clickNumber
        );

        // don't unregister the handler in this case
        return;
      }

      try {
        console.log(
          STRUMMING_LOG_PREFIX + "Chord press released",
          chordName,
          clickNumber
        );
        if (!isChordClicked(chordName) || isDisabled) {
          console.log(
            STRUMMING_LOG_PREFIX + "Chord not clicked yet - ignoring",
            chordName,
            clickNumber
          );
          return;
        }

        if (!isChordStrumming(chordName)) {
          console.log(
            STRUMMING_LOG_PREFIX +
              "Not playing when press released - stop strumming",
            chordName,
            clickNumber
          );

          // release clicked promise before removing chord data
          setClicked(false);
          // stop ticking if not yet playing - otherwise wait for the pattern to finish - it will stop ticking itself
          setPlaying(false);
        } else {
          setClicked(false);
        }
      } finally {
        unregister();
      }
    };

    const setClicked = (value: boolean) => {
      setIsClicked(value);
      if (value) {
        registerChordClick(chordName, clickNumber);
      } else {
        releaseChordClick(chordName, clickNumber);
      }
    };

    const setPlaying = (value: boolean) => {
      if (value) {
        markChordAsStrumming(chordName, clickNumber);
      } else {
        finishChordGracePeriod(chordName, clickNumber);
        setIsGracePeriod(false);
      }
      setIsPlaying(value);
    };

    console.log(STRUMMING_LOG_PREFIX + "Pressed chord", chordName, clickNumber);
    setClicked(true);

    register();

    if (isChordStrummingOrPendingStrumming(chordName)) {
      console.log(
        STRUMMING_LOG_PREFIX +
          "This chord is already strumming or pending strumming, ignoring",
        chordName,
        clickNumber
      );
      // Avoid starting new strumming the same chord while it is still playing.
      // Please note that setClicked should be set to true before returning to repeat the previous strumming
      // Without that it would double
      return;
    }

    // this is true when the clock is active (eg metronome or example is playing or recording is enabled)
    const wasMainClockActiveWhenStrummingStarted = isMainClockActive();

    if (isChordClicked(chordName)) {
      console.log(
        STRUMMING_LOG_PREFIX + "Mark as strumming",
        chordName,
        clickNumber
      );
      markChordAsPendingStrumming(chordName, clickNumber);
    } else {
      console.log(
        STRUMMING_LOG_PREFIX +
          "Already released mouse/touch after immediate chord. Don't start strumming",
        chordName,
        clickNumber
      );
      return;
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
    let intervalsToSkip = 0;

    if (!wasStrummingWhenChordPressed) {
      console.log(
        STRUMMING_LOG_PREFIX +
          "Playing chord immediately - no strumming happening now",
        chordName,
        clickNumber
      );

      console.log(STRUMMING_LOG_PREFIX + "Playing", chordName, clickNumber);
      play(false);
      if (useChordAlterationValue) {
        isAlternateRef.current = !isAlternateRef.current;
      }
    } else {
      console.log(
        STRUMMING_LOG_PREFIX +
          "Skip playing chord immediately - strumming happening now",
        chordName,
        clickNumber
      );
    }

    const getNumberOfTicks = () => {
      switch (chordStrummingIntervalValue) {
        case ChordStrummingInterval.Bar:
          return TICKS_IN_BAR;
        case ChordStrummingInterval.HalfBar:
          return TICKS_IN_HALF_BAR;
        case ChordStrummingInterval.Beat:
          return TICKS_IN_BEAT;
        case ChordStrummingInterval.HalfBeat:
          return TICKS_IN_HALF_BEAT;
        default:
          return 1;
      }
    };

    const getIntervalsToSkip = () => {
      // get the tick number since the last bar
      const currentTick = getCurrentRelativeTick();
      // get the value of
      const ticksInInterval = getNumberOfTicks();
      const ticksRemainingToTheNextInterval = currentTick % ticksInInterval;
      if (ticksRemainingToTheNextInterval === 0) {
        return 1;
      }
      const intervalsToSkip = Math.floor(currentTick / ticksInInterval);
      return intervalsToSkip + 1;
    };

    const waitAndStrum = async () => {
      let initialWait: () => Promise<void | void[]>;

      if (!isChordClicked(chordName)) {
        console.log(
          STRUMMING_LOG_PREFIX +
            "WAITING - not clicked at the moment of waiting. Don't wait and don't strum",
          chordName,
          clickNumber
        );
        return;
      }
      if (wasMainClockActiveWhenStrummingStarted) {
        console.log(
          STRUMMING_LOG_PREFIX + "Clock was active when clicked",
          chordName,
          clickNumber
        );

        if (clickedInOtherChordGracePeriod) {
          console.log(
            STRUMMING_LOG_PREFIX +
              `WAITING - Clicked in grace period. Waiting for it to finish to start strumming. Skipping ${GRACE_INTERVALS} intervals`,
            chordName,
            clickNumber
          );
          initialWait = () => Promise.all(otherChordsGracePeriodPromises);
          intervalsToSkip = GRACE_INTERVALS;
        } else if (isOtherChordStrumming) {
          console.log(
            STRUMMING_LOG_PREFIX +
              "WAITING - Waiting for current strumming pattern to finish before beginning strumming new chord",
            chordName,
            clickNumber
          );
          initialWait = () => Promise.all(otherChordsStrummingPromises);
        } else if (wasStrummingWhenChordPressed) {
          console.log(
            STRUMMING_LOG_PREFIX +
              "WAITING - Strumming not over - waiting for the next interval to strum",
            chordName,
            clickNumber
          );
          initialWait = waitBetween;
        } else if (
          isAnyTimerSpecificActivityRunning() &&
          !isOtherChordStrumming
        ) {
          intervalsToSkip = getIntervalsToSkip();
          console.log(
            STRUMMING_LOG_PREFIX +
              "WAITING - Metronome/play/recording active but no strumming - waiting for the next interval to strum (skipping %d intervals)",
            intervalsToSkip,
            chordName,
            clickNumber
          );
          initialWait = waitBetween;
        } else {
          console.log(
            STRUMMING_LOG_PREFIX +
              "WAITING - Clock active but the only activity is strumming from this chord - waiting for the next interval to strum",
            chordName,
            clickNumber
          );
          initialWait = waitBetween;
        }
      } else {
        console.log(
          STRUMMING_LOG_PREFIX +
            "WAITING - Clock not active - waiting for the next interval to strum and skip one interval",
          chordName,
          clickNumber
        );
        initialWait = waitBetween;
        intervalsToSkip = 1;
      }

      const currentClickPromise = getChordClickedPromise(chordName)?.then(
        () => PromiseType.WaitTimeOver
      );
      // either wait for the current strumming to become pending finishing or if nothing is strumming - then for the next interval (or bar if clock is active)
      const waitForAny = [initialWait().then(() => PromiseType.WaitTimeOver)];
      // click might get released before the actual wait time - in this case we need to release the wait and stop processing this event
      if (currentClickPromise) {
        waitForAny.push(currentClickPromise);
      }

      const promiseType = await Promise.any(waitForAny);

      if (
        promiseType === PromiseType.PressReleased ||
        !isChordClicked(chordName)
      ) {
        console.log(
          STRUMMING_LOG_PREFIX +
            "Already released mouse/touch after wait. Don't start strumming",
          chordName,
          clickNumber
        );
        return;
      }
      if (isChordStrumming(chordName)) {
        console.log(
          STRUMMING_LOG_PREFIX +
            "Already strumming this chord. Don't start strumming again",
          chordName,
          clickNumber
        );
        return;
      }

      const strum = async (
        startIndex: number,
        waitBetweenChords: () => Promise<void>,
        clickedInGracePeriod: boolean,
        clickNumber: number
      ): Promise<void> => {
        console.log(
          STRUMMING_LOG_PREFIX + "----> Started actual strumming",
          chordName,
          clickNumber
        );
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
            startChordGracePeriod(chordName, clickNumber);
            // Wait GRACE_INTERVALS intervals - This gives additional opportunity to press another chord and repeat the pattern
            if (!areOtherChordsStrumming(chordName)) {
              console.log(
                STRUMMING_LOG_PREFIX +
                  "Other chords are not strumming - play grace chords",
                chordName,
                clickNumber
              );

              for (let i = 0; i < GRACE_INTERVALS; i++) {
                if (areOtherChordsStrumming(chordName)) {
                  await playChordOnce(); // play subsequent chords only if there are other chords pending, otherwise just wait for grace period end
                } else {
                  await waitBetweenChords();
                }
                currentIndex++;
                if (currentIndex === currentPattern.length) {
                  currentIndex = 0;
                }
              }
            }
          }
        } finally {
          console.log(
            STRUMMING_LOG_PREFIX +
              "Strumming finished - setting isPlaying to false",
            chordName,
            clickNumber
          );
          setPlaying(false);
        }
      };

      // skip first chord if it was played immediately
      await strum(
        intervalsToSkip,
        waitBetween,
        clickedInOtherChordGracePeriod,
        clickNumber
      );
    };

    if (!isChordStrumming(chordName) && !wasStrummingWhenChordPressed) {
      console.log(
        STRUMMING_LOG_PREFIX + "Wait and strum with delay",
        chordName,
        clickNumber
      );
      // Add timeout of one beat in order to allow single click chords. There should be enough time to release the mouse even if clicked very close to the bar
      await asyncTimeout(waitAndStrum, bpmToMilliseconds(tempoBpmValue) / 2);
    } else {
      console.log(
        STRUMMING_LOG_PREFIX + "Wait and strum immediately",
        chordName,
        clickNumber
      );
      // if currently strumming there is usually no need to play additional chords, so it's better to not add additional wait time - it's good for smoother switch between strumming chords
      await waitAndStrum();
    }
  };

  return { onChordPress, isPlaying, isClicked, isGracePeriod, isAlternateRef };
};
