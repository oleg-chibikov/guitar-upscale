import { tempoBpmValue } from "../store/settingsSlice";
import { MetronomeEventBus } from "./eventBus";

export const bpmToMilliseconds = (bpm: number): number => {
  return 60000 / bpm / 2;
};

export const quarterBeatToMilliseconds = (bpm: number): number => {
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
const {
  waitForNext: waitForNextQuarterBeat,
  recreate: recreateNextQuarterBeat,
} = createPromise();
const { waitForNext: waitForNextHalfBeat, recreate: recreateNextHalfBeat } =
  createPromise();
const { waitForNext: waitForNextBeat, recreate: recreateNextBeat } =
  createPromise();

const resolveAll = () => {
  recreateNextTick(true);
  recreateNextBeat(true);
  recreateNextHalfBeat(true);
  recreateNextQuarterBeat(true);
};

export {
  waitForNextBeat,
  waitForNextHalfBeat,
  waitForNextQuarterBeat,
  waitForNextTick,
};

let timer: NodeJS.Timeout | undefined;
export const MAX_TICKS = 8;
export let currentTick = 0;

export const isIntervalSet = () => {
  return timer !== undefined;
};

export const stopInterval = (resolvePreviousPromises: boolean) => {
  if (timer) {
    clearInterval(timer);
    timer = undefined;
    if (resolvePreviousPromises) {
      // any wait will for the next tick will finish straight away
      resolveAll();
    }
  }
};

export const startInterval = (afresh: boolean = true) => {
  if (afresh) {
    currentTick = 0; // reset tick to 0
  }

  const onTick = () => {
    if (currentTick === MAX_TICKS) {
      currentTick = 0;
    }
    console.log("Tick " + currentTick);
    const isBeat = currentTick % 8 === 0; // Beat is every 8 ticks
    const isHalfBeat = currentTick % 4 === 0;
    const isQuarterBeat = currentTick % 2 === 0;
    if (isBeat) {
      recreateNextBeat();
    }
    if (isHalfBeat) {
      recreateNextHalfBeat();
    }
    if (isQuarterBeat) {
      recreateNextQuarterBeat();
    }
    recreateNextTick();
    MetronomeEventBus.next({ isBeat, tick: currentTick });
    currentTick++;
  };
  onTick(); // first tick starts immediately
  timer = setInterval(onTick, bpmToMilliseconds(tempoBpmValue));
};
