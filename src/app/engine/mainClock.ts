import { tempoBpmValue } from "@/app/store/settingsSlice";
import { MetronomeEventBus } from "./eventBus";

export const bpmToMilliseconds = (bpm: number): number => {
  return 60000 / bpm / 2;
};

export const beatToMilliseconds = (bpm: number): number => {
  return bpmToMilliseconds(bpm) * 4;
};

const createPromise = () => {
  let resolveCurrentPromise: (value: void | PromiseLike<void>) => void;
  let promise: Promise<void>;
  const recreatePromise = () => {
    promise = new Promise<void>((resolve) => {
      resolveCurrentPromise = resolve;
    });
  };

  recreatePromise();

  const waitForNext = async () => {
    await promise;
  };

  return {
    waitForNext,
    recreate: (stopOnly: boolean = false) => {
      resolveCurrentPromise();
      if (!stopOnly) {
        recreatePromise();
      }
    },
  };
};

const { waitForNext: waitForNextTick, recreate: recreateNextTick } =
  createPromise();
const { waitForNext: waitForNextHalfBeat, recreate: recreateNextHalfBeat } =
  createPromise();
const { waitForNext: waitForNextBeat, recreate: recreateNextBeat } =
  createPromise();
const { waitForNext: waitForNextHalfBar, recreate: recreateNextHalfBar } =
  createPromise();
const { waitForNext: waitForNextBar, recreate: recreateNextBar } =
  createPromise();

const resolveAll = () => {
  recreateNextTick(true);
  recreateNextBar(true);
  recreateNextHalfBar(true);
  recreateNextBeat(true);
  recreateNextHalfBeat(true);
};

export {
  waitForNextBar,
  waitForNextBeat,
  waitForNextHalfBar,
  waitForNextHalfBeat,
  waitForNextTick,
};

let timer: NodeJS.Timeout | undefined;
export const BEATS_IN_BAR = 4;
export const TICKS_IN_HALF_BEAT = 8; // main setting affecting granularity (how many ticks in beat/bar etc) // 8 means 64 ticks in a bar
export const TICKS_IN_BEAT = TICKS_IN_HALF_BEAT * 2;
export const HALF_BEATS_IN_BAR = BEATS_IN_BAR * 2;
export const TICKS_IN_BAR = BEATS_IN_BAR * TICKS_IN_BEAT;
export const TICKS_IN_HALF_BAR = TICKS_IN_BAR / 2;

console.log("Ticks in bar", TICKS_IN_BAR);

export let currentTick = 0; // this tick is reset on every MAX_TICKS
export let globalCurrentTick = 0; // this tick keeps incrementing while clock is active
export let currentHalfBeat = 0;
export let currentBeat = 0;
export let currentHalfBar = 0;
export let currentBar = 0;

export const isMainClockActive = () => {
  return timer !== undefined;
};

export const stopInterval = (resolvePreviousPromises: boolean) => {
  if (timer) {
    clearInterval(timer);
    timer = undefined;
    if (resolvePreviousPromises) {
      // any wait for the next interval will finish straight away
      resolveAll();
    }
  }
};

const reset = () => {
  currentTick = 0;
  currentHalfBeat = 0;
  currentBeat = 0;
  currentHalfBar = 0;
  currentBar = 0;
};

export const startInterval = (afresh: boolean) => {
  if (afresh) {
    globalCurrentTick = 0;
    reset();
    recreateNextBar();
    recreateNextHalfBar();
    recreateNextBeat();
    recreateNextHalfBeat();
    recreateNextTick();
  }

  const onTick = () => {
    const isBar = currentTick === TICKS_IN_BAR; // Bar is every 8 * BPM_MODIFIER ticks
    const isHalfBar = currentTick % TICKS_IN_HALF_BAR === 0;
    const isBeat = currentTick % TICKS_IN_BEAT === 0;
    const isHalfBeat = currentTick % TICKS_IN_HALF_BEAT === 0;

    if (isBar) {
      reset();
      recreateNextBar();
      currentBar++;
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
    }
    if (isHalfBeat) {
      recreateNextHalfBeat();
      currentHalfBeat++;
    }
    recreateNextTick();
    MetronomeEventBus.next({ isBar, isBeat, tick: currentTick });
    currentTick++;
    globalCurrentTick++;
  };
  onTick(); // first tick starts immediately
  timer = setInterval(
    onTick,
    bpmToMilliseconds(tempoBpmValue) / TICKS_IN_HALF_BEAT
  );
};
