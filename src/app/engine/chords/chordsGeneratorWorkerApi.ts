import { ChordModeVariationsContainer } from "@/app/data/chordModes";
import { Neck } from "@/app/engine/generateNeckRepresentation";

export const generateChords = (
  neck: Neck,
  useAdvancedChords: boolean,
  capo: number,
  onChordModeProcessed: (
    chordModeVariationsContainer: ChordModeVariationsContainer
  ) => void,
  onComplete: () => void
) => {
  const worker = new Worker(
    new URL("./chordsGeneratorWorker.ts", import.meta.url)
  );

  // TODO: Cancellation! it's important!
  // TODO: Types shared
  worker.onmessage = (event) => {
    const { type, chordModeVariationsContainer, index } = event.data as {
      type: string;
      chordModeVariationsContainer: ChordModeVariationsContainer;
      index: number;
    };

    if (type === "chordModeProcessed") {
      console.log(
        `Chord mode ${chordModeVariationsContainer.chordModeVariations.chordMode.name} (index: ${index}) has been processed.`
      );
      onChordModeProcessed(chordModeVariationsContainer);

      // Update your UI or perform any other necessary actions
    } else if (type === "processingComplete") {
      console.log("All chord modes have been processed.");
      // Perform any final actions needed when processing is complete
      onComplete();
    }
  };

  // To start the processing
  worker.postMessage({
    neck,
    useAdvancedChords,
    capo,
  });
};
