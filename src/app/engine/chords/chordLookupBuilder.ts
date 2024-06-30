import { getModeText } from "@/app/data/chordModes";
import { Chord, NOTE_COUNT, getNoteText } from "@/app/data/notes";
import { chordsValue } from "@/app/store/settingsSlice";

export const rebuildChordDetectorLookup = () => {
  if (!chordsValue) {
    return;
  }

  for (const chordModeVariations of chordsValue) {
    const modeKey = getModeText(chordModeVariations.chordMode);
    for (let note = 0; note < NOTE_COUNT; note++) {
      const fullKey = getNoteText(note) + modeKey;
      const variations = chordModeVariations.variationsByNote[note];
      variations?.map((variation) => {
        // if (chord.note === Note.A && mode.mode === ChordMode.Minor) {
        //   debugger;
        // }
        addChordToDetectorLookup?.(variation, fullKey);
      });
    }
  }
};

export const setChordDetectorFunctions = (
  clear: () => void,
  addChord: (chord: Chord, fullKey: string) => void
) => {
  clearChordDetector = clear;
  addChordToDetectorLookup = addChord;
  rebuildChordDetectorLookup(); // we need to re-scan all the chords after setting the function
};

export let clearChordDetector: () => void | undefined;

export let addChordToDetectorLookup:
  | ((chord: Chord, fullKey: string) => void)
  | undefined;
