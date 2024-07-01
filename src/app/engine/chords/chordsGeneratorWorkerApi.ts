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

const worker = new Worker(
  new URL("./chordsGeneratorWorker.ts", import.meta.url)
);

export const generateChords = (
  neck: Neck,
  capo: number,
  generationId: number,
  onChordModeProcessed: (
    chordModeVariationsContainer: ChordModeVariationsContainer
  ) => void,
  onComplete: () => void,
  onAbort?: () => void
) => {
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

          // Update your UI or perform any other necessary actions
        }
        break;
      case "processingComplete":
        console.log("All chord modes have been processed");
        // Perform any final actions needed when processing is complete
        onComplete();
        break;
      case "processingAborted":
        console.log("Chord processing aborted");
        onAbort?.();
        break;
    }
  };

  const allModes = [...chordModes, ...advancedChordModes];

  // To start the processing
  worker.postMessage({
    type: "start",
    neck,
    capo,
    chordModes: allModes,
    generationId,
  } as GenerateChordsWorkerMessage);
};

export const abortGeneratingChords = (generationId: number) => {
  worker.postMessage({
    type: "abort",
    generationId,
  } as GenerateChordsWorkerMessage);
};
