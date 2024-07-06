import {
  addChordsToDetectorLookup,
  setChordDetectorFunctions,
} from "@/app/engine/chords/chordLookupBuilder";

// returns a function to setup chord detector
export const useChordDetectorSetup = () => {
  return async () => {
    if (addChordsToDetectorLookup !== undefined) {
      return;
    }

    // async load detector module and set its functions to settings on the first detect action.
    const { chordDetectorWorkerApi } = await import(
      "@/app/engine/chords/chordDetectorWorkerApi"
    );
    const { chordDetectorBuilder } = await import(
      "@/app/engine/chords/chordDetectorBuilder"
    );
    setChordDetectorFunctions(
      chordDetectorBuilder.clear.bind(chordDetectorBuilder),
      chordDetectorWorkerApi.addChordsToDetectorLookup.bind(
        chordDetectorWorkerApi
      )
    );
  };
};
