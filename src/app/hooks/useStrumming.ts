import { getPatternById } from "@/app/data/chordStrummingPatterns";
import {
  AUTH_PANEL_ID,
  CHORDS_VIEW_EXPANDER_ID,
  CHORDS_VIEW_ID,
  CONTROL_PANEL_EXPANDER_ID,
  CONTROL_PANEL_ID,
  LOOPER_PANEL_ID,
  PLAY_PANEL_ID,
  SETTINGS_PANEL_ID,
  STRUMMING_SETTINGS_PANEL_ID,
} from "@/app/data/elementIds";
import {
  Pattern,
  TimeSignature,
  getTicksForTimeSignature,
} from "@/app/data/strummingData";
import {
  TICKS_IN_BAR,
  TICKS_IN_BEAT,
  TICKS_IN_HALF_BAR,
  TICKS_IN_HALF_BEAT,
} from "@/app/engine/clock/clockConstants";
import { bpmToMilliseconds } from "@/app/helpers/clockHelper";
import { useCallback, useRef } from "react";
import {
  currentTick,
  isMainClockActiveValue,
  waitForNextBar,
  waitForNextBeat,
  waitForNextHalfBar,
  waitForNextHalfBeat,
  waitForNextSixteenth,
  waitForNextSixtyFourth,
  waitForNextThirtySecond,
} from "../engine/clock/mainClock";
import { ChordEventBus } from "../engine/eventBus";
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
  chordCustomStrummingPatternIdValue,
  chordCustomStrummingWaitForPatternFinishValue,
  isAnyTimerSpecificActivityRunning,
  seamlessChordSwitchingValue,
  tempoBpmValue,
  useChordAlterationValue,
} from "../store/settingsSlice";

const stopStrummingElementIds = [
  CHORDS_VIEW_ID,
  CHORDS_VIEW_EXPANDER_ID,
  CONTROL_PANEL_ID,
  CONTROL_PANEL_EXPANDER_ID,
  STRUMMING_SETTINGS_PANEL_ID,
  LOOPER_PANEL_ID,
  AUTH_PANEL_ID,
  PLAY_PANEL_ID,
  SETTINGS_PANEL_ID,
];

const GRACE_INTERVALS = 2;

enum PromiseType {
  PressReleased = 1,
  WaitTimeOver = 2,
}

const getIntervalsToSkip = (patternObject: Pattern) => {
  // Get the tick number since the last bar
  const ticksSinceLastBar = currentTick;

  // Get the number of ticks in one interval of the pattern
  const ticksInInterval = getTicksForTimeSignature(patternObject.timeSignature);

  // Calculate the total ticks in the pattern
  const totalTicksInPattern = ticksInInterval * patternObject.strums.length;

  let targetTicks, nextEventName;

  if (totalTicksInPattern >= TICKS_IN_BAR) {
    // Pattern is at least one bar long, wait for next bar
    targetTicks = TICKS_IN_BAR;
    nextEventName = "bar";
  } else if (totalTicksInPattern >= TICKS_IN_HALF_BAR) {
    // Pattern is at least half bar long, wait for next half bar
    targetTicks = TICKS_IN_HALF_BAR;
    nextEventName = "half bar";
  } else if (totalTicksInPattern >= TICKS_IN_BEAT) {
    // Pattern is at least one beat long, wait for next beat
    targetTicks = TICKS_IN_BEAT;
    nextEventName = "beat";
  } else {
    // Pattern is shorter than one beat, wait for next half beat
    targetTicks = TICKS_IN_HALF_BEAT;
    nextEventName = "half beat";
  }

  // Calculate the tick of the next event
  const nextEventTick =
    Math.ceil(ticksSinceLastBar / targetTicks) * targetTicks;

  // Calculate how many ticks remain until the next target event
  const ticksRemainingToNextEvent = nextEventTick - ticksSinceLastBar;

  // Calculate how many full intervals remain until the next target event
  const intervalsRemainingToNextEvent = Math.floor(
    ticksRemainingToNextEvent / ticksInInterval
  );

  // Calculate how many strums to skip
  const totalStrumsInPattern = patternObject.strums.length;
  const strumsToSkip = totalStrumsInPattern - intervalsRemainingToNextEvent;

  console.log(
    STRUMMING_LOG_PREFIX +
      "Ticks in interval %s: %d, Ticks since last bar: %d, next %s starts at %d tick, ticks remaining to next %s: %d, intervals remaining: %d, intervals to skip: %d",
    patternObject.timeSignature,
    ticksInInterval,
    ticksSinceLastBar,
    nextEventName,
    nextEventTick,
    nextEventName,
    ticksRemainingToNextEvent,
    intervalsRemainingToNextEvent,
    strumsToSkip
  );

  // Ensure we don't return a negative number
  // One interval should be skipped for sure as we played the chord immediately
  return Math.max(1, strumsToSkip);
};

const getWaitBetweenFunc = (timeSignature: TimeSignature) => {
  switch (timeSignature) {
    case TimeSignature.ONE_BAR:
      return waitForNextBar;
    case TimeSignature.HALF_BAR:
      return waitForNextHalfBar;
    case TimeSignature.ONE_BEAT:
      return waitForNextBeat;
    case TimeSignature.HALF_BEAT:
      return waitForNextHalfBeat;
    case TimeSignature.ONE_SIXTEENS:
      return waitForNextSixteenth;
    case TimeSignature.ONE_THIRTY_SECOND:
      return waitForNextThirtySecond;
    case TimeSignature.ONE_SIXTY_FOURTH:
      return waitForNextSixtyFourth;
    default:
      throw new Error(`Unsupported time signature: ${timeSignature}`);
  }
};

export const useStrumming = (
  chordName: string,
  isDisabled: boolean,
  hasTouchInput: boolean,
  setClickedState: (value: boolean) => void,
  setPlayingState: (value: boolean) => void,
  setGracePeriodState: (value: boolean) => void
) => {
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

    const currentPatternId = chordCustomStrummingPatternIdValue;
    const patternObject = getPatternById(currentPatternId);
    if (!patternObject) {
      console.error("No strumming pattern selected!");
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
        document.removeEventListener("mouseup", handlePressReleased, true);
      hasTouchInput &&
        document.removeEventListener("touchend", handlePressReleased, true);
    };

    const handlePressReleased = (event: MouseEvent | TouchEvent) => {
      let target = event.target as Node | null;

      while (target && target !== document) {
        const id = (target as HTMLElement)?.id;
        // keep playing chord when clicking notes simultaneously
        if (stopStrummingElementIds.includes(id)) {
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

          return;
        }
        target = target.parentNode;
      }

      console.log(
        STRUMMING_LOG_PREFIX +
          "Clicked outside of chords view - ignoring press release",
        chordName,
        clickNumber
      );

      // don't unregister the handler in this case
    };

    const setClicked = (value: boolean) => {
      if (value) {
        registerChordClick(chordName, clickNumber);
      } else {
        releaseChordClick(chordName, clickNumber);
      }
      setClickedState(value);
    };

    const setPlaying = (value: boolean) => {
      if (value) {
        markChordAsStrumming(chordName, clickNumber);
      } else {
        finishChordGracePeriod(chordName, clickNumber);
        setGracePeriodState(false);
      }
      setPlayingState(value);
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
    const wasMainClockActiveWhenStrummingStarted = isMainClockActiveValue;

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

    const patternTimeSignature = patternObject.timeSignature;
    const waitBetween = getWaitBetweenFunc(patternTimeSignature);

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

    const waitAndStrum = async () => {
      if (!isChordClicked(chordName)) {
        console.log(
          STRUMMING_LOG_PREFIX +
            "WAITING - not clicked at the moment of waiting. Don't wait and don't strum",
          chordName,
          clickNumber
        );
        return;
      }

      // TODO: Bug! sometimes it plays the pattern with shift. Not matching the correct ticks
      const getInitialWait = () => {
        let skipIntervals: number | undefined;
        let initialWait: () => Promise<void | void[]>;
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
            skipIntervals = GRACE_INTERVALS;
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
            skipIntervals = getIntervalsToSkip(patternObject);
            console.log(
              STRUMMING_LOG_PREFIX +
                "WAITING - Metronome/play/recording active but no strumming - waiting for the next interval to strum (skipping %d intervals)",
              skipIntervals,
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
          skipIntervals = 1; // skipping one as we already played one chord immediately
        }
        return { initialWait, skipIntervals };
      };

      const { initialWait, skipIntervals } = getInitialWait();
      if (skipIntervals !== undefined) {
        intervalsToSkip = skipIntervals;
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
          STRUMMING_LOG_PREFIX +
            "----> Started actual strumming at tick %d skipping %d intervals",
          currentTick,
          startIndex,
          chordName,
          clickNumber
        );
        setPlaying(true);
        try {
          let currentIndex = startIndex; // skip first as it was played already

          const playChordOnce = async () => {
            const char = patternObject.strums[currentIndex];
            switch (char) {
              case "↑":
                isAlternateRef.current = false;
                play(clickedInGracePeriod);
                break;
              case "↓":
                isAlternateRef.current = true;
                play(clickedInGracePeriod);
                break;
              case "":
                break;
              default:
                return; // ignore all the other symbols
            }

            await waitBetweenChords();
          };

          const resetStrummingPosition = () => {
            console.log(
              STRUMMING_LOG_PREFIX +
                "Start over the strumming pattern. Current tick",
              currentTick
            );
            currentIndex = 0;
          };

          if (currentIndex === 0) {
            resetStrummingPosition(); // just to log
          }

          while (isChordClicked(chordName)) {
            for (; currentIndex < patternObject.strums.length; currentIndex++) {
              if (!chordCustomStrummingWaitForPatternFinishValue) {
                // early break pattern only when the checkbox is off
                if (!isChordClicked(chordName)) {
                  // already released mouse/touch - don't play the strumming
                  return;
                }
              }
              await playChordOnce();
            }

            resetStrummingPosition();
          }

          if (chordCustomStrummingWaitForPatternFinishValue) {
            setGracePeriodState(true);
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
                if (currentIndex === patternObject.strums.length) {
                  resetStrummingPosition();
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

  return { onChordPress, isAlternateRef };
};
