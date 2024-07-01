import {
  GenerateChordsWorkerMessage,
  WorkerMessageWrapper,
} from "@/app/data/chordsGeneratorTypes";
import { chordsGenerator } from "@/app/engine/chords/chordsGenerator";

self.onmessage = (event: WorkerMessageWrapper<GenerateChordsWorkerMessage>) => {
  const { type } = event.data;

  if (type === "start") {
    const { type, ...rest } = event.data;
    chordsGenerator.processInWorker(rest);
  } else if (type === "abort") {
    const { type, ...rest } = event.data;
    chordsGenerator.abortProcessing(rest);
  }
};
