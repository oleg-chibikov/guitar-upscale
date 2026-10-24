import { ChordModeVariations } from "@/app/data/chordModes";

export const setChordDetectorFunctions = (
  clear: () => void,
  addChord: (chordModeVariations: ChordModeVariations) => void,
) => {
  clearChordDetector = clear;
  addChordsToDetectorLookup = addChord;
};

export let clearChordDetector: (() => void) | undefined;

export let addChordsToDetectorLookup:
  ((chordModeVariations: ChordModeVariations) => void) | undefined;
