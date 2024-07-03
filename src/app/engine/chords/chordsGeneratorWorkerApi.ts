import {
  ChordModeVariationsContainer,
  advancedChordModes,
  chordModes,
} from "@/app/data/chordModes";
import {
  GenerateChordsCallbackMessage,
  GenerateChordsWorkerMessage,
  WorkerMessageWrapper,
} from "@/app/data/chordsGeneratorTypes";
import { Neck } from "@/app/engine/generateNeckRepresentation";

let worker: Worker | undefined;
let chordsWaitResolve: (() => void) | undefined;

export const setPromiseToResolveWhenChordsAreLoaded = (
  resolve: () => void | undefined
) => {
  chordsWaitResolve = resolve;
};

export const abortGeneratingChords = () => {
  if (worker) {
    console.log("Terminate worker");
    worker.terminate();
    worker = undefined;
  }
};

export const generateChords = (
  neck: Neck,
  capo: number,
  onChordModeProcessed: (
    chordModeVariationsContainer: ChordModeVariationsContainer
  ) => void,
  onComplete: () => void
) => {
  console.log("Start generating chords");

  worker = new Worker(new URL("./chordsGeneratorWorker.ts", import.meta.url));

  // Set up the new worker's onmessage handler
  worker.onmessage = (
    event: WorkerMessageWrapper<GenerateChordsCallbackMessage>
  ) => {
    const { type } = event.data;

    switch (type) {
      case "chordModeProcessed":
        {
          const { chordModeVariationsContainer, index } = event.data;
          console.log(
            `Chord mode ${chordModeVariationsContainer.chordModeVariations.chordMode.name} (index: ${index}) has been processed`
          );
          onChordModeProcessed(chordModeVariationsContainer);
        }
        break;
      case "processingComplete":
        console.log("All chord modes have been processed");
        onComplete();
        worker = undefined;
        chordsWaitResolve?.();
        chordsWaitResolve = undefined;

        break;
    }
  };

  const allModes = [...chordModes, ...advancedChordModes];

  // Start the processing
  worker.postMessage({
    type: "start",
    neck,
    capo,
    chordModes: allModes,
  } as GenerateChordsWorkerMessage);
};
