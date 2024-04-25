import { MetronomeEventBus } from "./eventBus";

export const bpmToMilliseconds = (bpm: number): number => {
  return 60000 / bpm / 2;
};

export const quarterBeatToMilliseconds = (bpm: number): number => {
  return bpmToMilliseconds(bpm) * 4;
};

const createPromise = () => {
  let resolveCurrentPromise: (value: void | PromiseLike<void>) => void;
  let waitForNextTickPromise: Promise<void>;
  const recreatePromise = () => {
    waitForNextTickPromise = new Promise<void>((resolve) => {
      resolveCurrentPromise = resolve;
    });
  };

  recreatePromise();

  const waitForNext = async () => {
    await waitForNextTickPromise;
  };

  return {
    waitForNext,
    recreate: () => {
      resolveCurrentPromise();
      recreatePromise();
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

export {
  waitForNextBeat,
  waitForNextHalfBeat,
  waitForNextQuarterBeat,
  waitForNextTick,
};

let timer: NodeJS.Timeout | undefined;
const MAX_TICKS = 16;
let tick = MAX_TICKS - 1;
export const setBpm = (bpm: number) => {
  timer && clearInterval(timer);
  timer = setInterval(() => {
    if (++tick === MAX_TICKS) {
      tick = 0;
    }
    const isBeat = tick % 8 === 0;
    const isHalfBeat = tick % 4 === 0;
    const isQuarterBeat = tick % 2 === 0;
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
    MetronomeEventBus.next({ isBeat, tick });
  }, bpmToMilliseconds(bpm));
};
