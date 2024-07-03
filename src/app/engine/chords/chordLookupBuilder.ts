import { getModeText } from "@/app/data/chordModes";
import { Chord, NOTE_COUNT, getNoteText } from "@/app/data/notes";
import { getSlashChordsForVariation } from "@/app/engine/chords/slashChordGenerator";
import {
  capoValue,
  chordsAreLoadingValue,
  chordsValue,
  neckValue,
} from "@/app/store/settingsSlice";

export const rebuildChordDetectorLookup = () => {
  const capo = capoValue;
  const neck = neckValue;
  const addToDetector = addChordToDetectorLookup;
  if (!chordsValue || !addToDetector || !neck) {
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
        addToDetector(variation, fullKey);
        const slashChordsGenerator = getSlashChordsForVariation(
          variation,
          neck,
          capo
        );
        let result = slashChordsGenerator.next();

        while (!result.done) {
          const slashChord = result.value;
          if (slashChord) {
            addToDetector(
              slashChord.variation,
              `${fullKey}/${getNoteText(slashChord.bassNote.note)}`
            );
          }
          result = slashChordsGenerator.next();
        }
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
  if (chordsAreLoadingValue) {
    // This is unlikely to happen as the button is disabled until the chords are loaded
    return; // if chords are being loaded then rebuildChordDetectorLookup will be called once they are built. No need to call it once more
  }
  rebuildChordDetectorLookup(); // we need to re-scan all the chords after setting the function
};

export let clearChordDetector: () => void | undefined;

export let addChordToDetectorLookup:
  | ((chord: Chord, fullKey: string) => void)
  | undefined;
