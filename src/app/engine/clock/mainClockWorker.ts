import { TICKS_IN_HALF_BEAT } from "@/app/engine/clock/clockConstants";

const bpmToMilliseconds = (bpm: number): number => 60_000 / bpm / 2;

let timer: NodeJS.Timeout | undefined;

type WorkerMessage =
  | {
      type: "start";
      tempoBpm: number;
    }
  | { type: "stop" };

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type } = event.data;
  if (type === "start") {
    startInterval(event.data.tempoBpm);
  } else if (type === "stop") {
    stopInterval();
  }
};

const startInterval = (tempoBpm: number) => {
  stopInterval();
  timer = setInterval(onTick, bpmToMilliseconds(tempoBpm) / TICKS_IN_HALF_BEAT);
};

const stopInterval = () => {
  if (timer !== undefined) {
    clearInterval(timer);
    timer = undefined;
  }
};

const onTick = () => {
  self.postMessage({ type: "tick" });
};

self.postMessage({ type: "ready" });
