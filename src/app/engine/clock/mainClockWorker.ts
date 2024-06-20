import { TICKS_IN_HALF_BEAT } from "@/app/engine/clock/clockConstants";
import { bpmToMilliseconds } from "@/app/helpers/clockHelper";
// Web worker is used so that no other code interrupts the interval. Without it sometimes the interval slows down, but it is a time-critical thing and should be as precise as possible

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
  onTick(); // first tick starts immediately
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
