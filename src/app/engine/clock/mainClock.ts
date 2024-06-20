import {
  TICKS_IN_BAR,
  TICKS_IN_BEAT,
  TICKS_IN_HALF_BAR,
  TICKS_IN_HALF_BEAT,
} from "@/app/engine/clock/clockConstants";
import { createPromise } from "@/app/helpers/promiseHelper";
import { tempoBpmValue } from "../../store/settingsSlice";
import { MetronomeEventBus } from "../eventBus";

const MILLISECONDS_PER_MINUTE = 60_000;
const MICROSECONDS_PER_MINUTE = MILLISECONDS_PER_MINUTE * 1000;

export const bpmToMilliseconds = (bpm: number): number => 60_000 / bpm / 2;

export const microsecondsToBpm = (microsecondsPerBeat: number): number =>
  Math.floor(MICROSECONDS_PER_MINUTE / microsecondsPerBeat);

export const beatToMilliseconds = (bpm: number): number =>
  bpmToMilliseconds(bpm) * 4;

const { waitFor: waitForNextTick, recreate: recreateNextTick } =
  createPromise();
const { waitFor: waitForNextHalfBeat, recreate: recreateNextHalfBeat } =
  createPromise();
const { waitFor: waitForNextBeat, recreate: recreateNextBeat } =
  createPromise();
const { waitFor: waitForNextHalfBar, recreate: recreateNextHalfBar } =
  createPromise();
const { waitFor: waitForNextBar, recreate: recreateNextBar } = createPromise();

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

const worker = new Worker(new URL("./mainClockWorker.ts", import.meta.url));

export let currentTick = 0; // this tick is reset on every MAX_TICKS
export let globalCurrentTick = 0; // this tick keeps incrementing while clock is active
export let globalCurrentLastBarTick = 0;
export let globalCurrentLastBeatTick = 0;
export let currentHalfBeat = 0;
export let currentBeat = 0;
export let currentHalfBar = 0;
export let currentBar = 0;
export let isMainClockActiveValue: boolean = false;

export const getCurrentRelativeTick = () =>
  globalCurrentTick - globalCurrentLastBarTick;

export const stopInterval = (resolvePreviousPromises: boolean) => {
  worker.postMessage({ type: "stop", tempoBpm: tempoBpmValue });
  isMainClockActiveValue = false;
  if (resolvePreviousPromises) {
    // any wait for the next interval will finish straight away
    resolveAll();
  }
};

export const startInterval = (afresh: boolean) => {
  if (afresh) {
    globalCurrentTick = 0;
    globalCurrentLastBeatTick = 0;
    globalCurrentLastBarTick = 0;
    reset();
    recreateNextBar();
    recreateNextHalfBar();
    recreateNextBeat();
    recreateNextHalfBeat();
    recreateNextTick();
  }

  isMainClockActiveValue = true;

  worker.postMessage({ type: "start", tempoBpm: tempoBpmValue });
};

export const waitForTick = async (
  tickToWaitFor: number,
  currentTick: number,
  checkFinished: () => boolean,
  logPrefix: string
) => {
  const ticksToWait = tickToWaitFor - currentTick;
  console.log(logPrefix + "Waiting for %d ticks", ticksToWait);
  for (let i = 0; i < ticksToWait; i++) {
    if (checkFinished()) {
      return Promise.resolve();
    }
    await waitForNextTick();
  }
};

export const resolveNextTick = () => {
  recreateNextTick(true);
};

const reset = () => {
  currentTick = 0;
  currentHalfBeat = 0;
  currentBeat = 0;
  currentHalfBar = 0;
  currentBar = 0;
};

const onTick = () => {
  const isBar = currentTick === TICKS_IN_BAR; // Bar is every 8 * BPM_MODIFIER ticks
  const isHalfBar = currentTick % TICKS_IN_HALF_BAR === 0;
  const isBeat = currentTick % TICKS_IN_BEAT === 0;
  const isHalfBeat = currentTick % TICKS_IN_HALF_BEAT === 0;

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
  recreateNextTick();
  MetronomeEventBus.next({ isBar, isBeat, tick: currentTick });
  currentTick++;
  globalCurrentTick++;
};

worker.onmessage = (event: MessageEvent) => {
  const { type } = event.data;
  if (type === "tick") {
    onTick();
  }
};
