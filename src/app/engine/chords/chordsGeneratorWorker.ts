import { GenerateChordsWorkerMessage } from "@/app/data/chordsGeneratorTypes";
import { WorkerMessageWrapper } from "@/app/data/workerTypes";
import { chordsGenerator } from "@/app/engine/chords/chordsGenerator";

self.onmessage = (event: WorkerMessageWrapper<GenerateChordsWorkerMessage>) => {
  const { type } = event.data;

  if (type === "start") {
    chordsGenerator.processInWorker(event.data);
  }
};
