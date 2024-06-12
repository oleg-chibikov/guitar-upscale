import { getModeText } from "@/app/data/chordModes";
import { Chord, getNoteText } from "@/app/data/notes";
import { chordsValue } from "@/app/store/settingsSlice";

export const rebuildChordDetectorLookup = () => {
  if (!chordsValue) {
    return;
  }

  for (const chord of chordsValue) {
    const key = getNoteText(chord.note);
    for (const mode of chord.modes) {
      const modeKey = getModeText(mode.mode);
      const fullKey = key + modeKey;
      mode.variations.map((variation) => {
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
