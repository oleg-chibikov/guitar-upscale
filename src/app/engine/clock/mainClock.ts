import {
  TICKS_IN_BAR,
  TICKS_IN_BEAT,
  TICKS_IN_HALF_BAR,
  TICKS_IN_HALF_BEAT,
  TICKS_IN_SIXTEENTH,
  TICKS_IN_SIXTY_FOURTH,
  TICKS_IN_THIRTY_SECOND,
} from "@/app/data/clockConstants";
import { createPromise } from "@/app/helpers/promiseHelper";
import { tempoBpmValue } from "../../store/settingsSlice";
import { MetronomeEventBus } from "../eventBus";

const { waitFor: waitForNextBar, recreate: recreateNextBar } = createPromise();
const { waitFor: waitForNextHalfBar, recreate: recreateNextHalfBar } =
  createPromise();
const { waitFor: waitForNextBeat, recreate: recreateNextBeat } =
  createPromise();
const { waitFor: waitForNextHalfBeat, recreate: recreateNextHalfBeat } =
  createPromise();
const { waitFor: waitForNextSixteenth, recreate: recreateNextSixteenth } =
  createPromise();
const { waitFor: waitForNextThirtySecond, recreate: recreateNextThirtySecond } =
  createPromise();
const { waitFor: waitForNextSixtyFourth, recreate: recreateNextSixtyFourth } =
  createPromise();
const { waitFor: waitForNextTick, recreate: recreateNextTick } =
  createPromise();

const resolveAll = () => {
  recreateNextBar(true);
  recreateNextHalfBar(true);
  recreateNextBeat(true);
  recreateNextHalfBeat(true);
  recreateNextSixteenth(true);
  recreateNextThirtySecond(true);
  recreateNextSixtyFourth(true);
  recreateNextTick(true);
};

export {
  waitForNextBar,
  waitForNextBeat,
  waitForNextHalfBar,
  waitForNextHalfBeat,
  waitForNextSixteenth,
  waitForNextSixtyFourth,
  waitForNextThirtySecond,
  waitForNextTick,
};

const worker =
  typeof window !== "undefined"
    ? new Worker(new URL("./mainClockWorker.ts", import.meta.url))
    : undefined;

export let currentTick = 0; // this tick is reset on every MAX_TICKS
export let globalCurrentTick = 0; // this tick keeps incrementing while clock is active
export let globalCurrentLastBarTick = 0;
export let globalCurrentLastBeatTick = 0;

export let currentBar = 0;
export let currentHalfBar = 0;
export let currentBeat = 0;
export let currentHalfBeat = 0;
export let currentSixteenth = 0;
export let currentThirtySecond = 0;
export let currentSixtyFourth = 0;
export let isMainClockActiveValue: boolean = false;

export const stopInterval = (resolvePreviousPromises: boolean) => {
  worker?.postMessage({ type: "stop", tempoBpm: tempoBpmValue });
  isMainClockActiveValue = false;
  if (resolvePreviousPromises) {
    // any wait for the next interval will finish straight away
    resolveAll();
  }
};

export const startInterval = (afresh: boolean) => {
  if (afresh) {
    globalCurrentLastBarTick = 0;
    globalCurrentLastBeatTick = 0;
    globalCurrentTick = 0;
    reset();
    recreateNextBar();
    recreateNextHalfBar();
    recreateNextBeat();
    recreateNextHalfBeat();
    recreateNextSixteenth();
    recreateNextThirtySecond();
    recreateNextSixtyFourth();
    recreateNextTick();
  }

  isMainClockActiveValue = true;

  worker?.postMessage({ type: "start", tempoBpm: tempoBpmValue });
};

export const resolveNextTick = () => {
  // releases the current waiters once. Leaving the promise resolved would let tick loops spin until the next real tick
  recreateNextTick();
};

// position inside the bar of the tick that fired last. Bars start every TICKS_IN_BAR global ticks
export const getLastTickBarPosition = () =>
  (((globalCurrentTick - 1) % TICKS_IN_BAR) + TICKS_IN_BAR) % TICKS_IN_BAR;

const reset = () => {
  currentBar = 0;
  currentHalfBar = 0;
  currentBeat = 0;
  currentHalfBeat = 0;
  currentSixteenth = 0;
  currentThirtySecond = 0;
  currentSixtyFourth = 0;
  currentTick = 0;
};

const onTick = () => {
  const isBar = currentTick % TICKS_IN_BAR === 0; // Bar is every 8 * BPM_MODIFIER ticks
  const isHalfBar = currentTick % TICKS_IN_HALF_BAR === 0;
  const isBeat = currentTick % TICKS_IN_BEAT === 0;
  const isHalfBeat = currentTick % TICKS_IN_HALF_BEAT === 0;
  const isSixteenth = currentTick % TICKS_IN_SIXTEENTH === 0;
  const isThirtySecond = currentTick % TICKS_IN_THIRTY_SECOND === 0;
  const isSixtyFourth = currentTick % TICKS_IN_SIXTY_FOURTH === 0;
  MetronomeEventBus.next({ isBar, isBeat, tick: currentTick });

  if (isBar) {
    reset();
    recreateNextBar();
    currentBar++;
    globalCurrentLastBarTick = globalCurrentTick;
  }
  // console.log(
  //   "Tick ",
  //   currentTick,
  //   globalCurrentTick,
  //   currentBar,
  //   currentHalfBar,
  //   currentBeat,
  //   currentHalfBeat
  // );

  if (isHalfBar) {
    recreateNextHalfBar();
    currentHalfBar++;
  }
  if (isBeat) {
    recreateNextBeat();
    currentBeat++;
    globalCurrentLastBeatTick = globalCurrentTick;
  }
  if (isHalfBeat) {
    recreateNextHalfBeat();
    currentHalfBeat++;
  }
  if (isSixteenth) {
    recreateNextSixteenth();
    currentSixteenth++;
  }
  if (isThirtySecond) {
    recreateNextThirtySecond();
    currentThirtySecond++;
  }
  if (isSixtyFourth) {
    recreateNextSixtyFourth();
    currentSixtyFourth++;
  }
  recreateNextTick();
  currentTick++;
  globalCurrentTick++;
};

if (worker) {
  worker.onmessage = (event: MessageEvent) => {
    const { type } = event.data;
    if (type === "tick") {
      onTick();
    }
  };
}
