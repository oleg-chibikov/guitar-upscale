import {
  addChordToDetectorLookup,
  setChordDetectorFunctions,
} from "@/app/engine/chords/chordLookupBuilder";

// returns a function to setup chord detector
export const useChordDetectorSetup = () => {
  return async () => {
    if (addChordToDetectorLookup !== undefined) {
      return;
    }

    // async load detector module and set its functions to settings on the first detect action.
    const { chordDetector } = await import("@/app/engine/chords/chordDetector");
    const { chordDetectorBuilder } = await import(
      "@/app/engine/chords/chordDetectorBuilder"
    );
    setChordDetectorFunctions(
      chordDetectorBuilder.clear.bind(chordDetectorBuilder),
      chordDetector.addChordToDetectorLookup.bind(chordDetector)
    );
  };
};
