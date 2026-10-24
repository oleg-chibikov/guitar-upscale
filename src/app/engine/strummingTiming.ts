import {
  TICKS_IN_BAR,
  TICKS_IN_BEAT,
  TICKS_IN_HALF_BAR,
  TICKS_IN_HALF_BEAT,
  getTicksForTimeSignature,
} from "@/app/data/clockConstants";
import { StrummingPattern } from "@/app/data/strummingPatterns";
import { debugLog } from "@/app/helpers/debugLog";

// Skips strums so that a pattern started mid-way lands on the next bar, half bar, beat or half beat.
export const getIntervalsToSkip = (
  patternObject: Pick<StrummingPattern, "timeSignature" | "strums">,
  tick: number,
): number => {
  const ticksInInterval = getTicksForTimeSignature(patternObject.timeSignature);
  const totalTicksInPattern = ticksInInterval * patternObject.strums.length;

  let targetTicks, nextEventName;

  if (totalTicksInPattern >= TICKS_IN_BAR) {
    targetTicks = TICKS_IN_BAR;
    nextEventName = "bar";
  } else if (totalTicksInPattern >= TICKS_IN_HALF_BAR) {
    targetTicks = TICKS_IN_HALF_BAR;
    nextEventName = "half bar";
  } else if (totalTicksInPattern >= TICKS_IN_BEAT) {
    targetTicks = TICKS_IN_BEAT;
    nextEventName = "beat";
  } else {
    targetTicks = TICKS_IN_HALF_BEAT;
    nextEventName = "half beat";
  }

  const nextEventTick = Math.ceil(tick / targetTicks) * targetTicks;
  const ticksRemainingToNextEvent = nextEventTick - tick;
  const intervalsRemainingToNextEvent = Math.floor(
    ticksRemainingToNextEvent / ticksInInterval,
  );
  const strumsToSkip =
    patternObject.strums.length - intervalsRemainingToNextEvent;

  debugLog(
    "Strumming: Ticks in interval %s: %d, Ticks since last bar: %d, next %s starts at %d tick, ticks remaining to next %s: %d, intervals remaining: %d, intervals to skip: %d",
    patternObject.timeSignature,
    ticksInInterval,
    tick,
    nextEventName,
    nextEventTick,
    nextEventName,
    ticksRemainingToNextEvent,
    intervalsRemainingToNextEvent,
    strumsToSkip,
  );

  // The chord already played once on the press, so at least one strum is skipped.
  return Math.max(1, strumsToSkip);
};
