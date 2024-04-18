import { MetronomeEventBus } from "./eventBus";

const bpmToMilliseconds = (bpm: number): number => {
  return 60000 / bpm / 2;
};

let resolveCurrentPromiseForNextTick: (value: void | PromiseLike<void>) => void;
let waitForNextTickPromise: Promise<void>;
const recreatePromiseForNextTick = () => {
  waitForNextTickPromise = new Promise<void>((resolve) => {
    resolveCurrentPromiseForNextTick = resolve;
  });
};

recreatePromiseForNextTick();

export const waitForNextTick = async () => {
  await waitForNextTickPromise;
};

let resolveCurrentPromiseForNextBeat: (value: void | PromiseLike<void>) => void;
let waitForNextBeatPromise: Promise<void>;
const recreatePromiseForNextBeat = () => {
  waitForNextBeatPromise = new Promise<void>((resolve) => {
    resolveCurrentPromiseForNextBeat = resolve;
  });
};

recreatePromiseForNextBeat();

export const waitForNextBeat = async () => {
  await waitForNextBeatPromise;
};

let timer: NodeJS.Timeout | undefined;
let tick = 15;
export const setBpm = (bpm: number) => {
  timer && clearInterval(timer);
  timer = setInterval(() => {
    if (++tick === 16) {
      tick = 0;
    }
    const isBeat = tick === 0 || tick === 8;
    if (isBeat) {
      // console.log("Accented Tick!");
      resolveCurrentPromiseForNextBeat();
      recreatePromiseForNextBeat();
    }
    MetronomeEventBus.next({ isBeat, tick });
    // console.log("TICK!");
    resolveCurrentPromiseForNextTick();
    recreatePromiseForNextTick();
  }, bpmToMilliseconds(bpm));
};
