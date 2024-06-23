import {
  TICKS_IN_BAR,
  TICKS_IN_BEAT,
  TICKS_IN_HALF_BAR,
  TICKS_IN_HALF_BEAT,
} from "@/app/engine/clock/clockConstants";
import { createPromise } from "@/app/helpers/promiseHelper";
import { tempoBpmValue } from "../../store/settingsSlice";
import { MetronomeEventBus } from "../eventBus";

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

const worker =
  typeof window !== "undefined"
    ? new Worker(new URL("./mainClockWorker.ts", import.meta.url))
    : undefined;

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
  worker?.postMessage({ type: "stop", tempoBpm: tempoBpmValue });
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

  worker?.postMessage({ type: "start", tempoBpm: tempoBpmValue });
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
  const isBar = currentTick % TICKS_IN_BAR === 0; // Bar is every 8 * BPM_MODIFIER ticks
  const isHalfBar = currentTick % TICKS_IN_HALF_BAR === 0;
  const isBeat = currentTick % TICKS_IN_BEAT === 0;
  const isHalfBeat = currentTick % TICKS_IN_HALF_BEAT === 0;
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
