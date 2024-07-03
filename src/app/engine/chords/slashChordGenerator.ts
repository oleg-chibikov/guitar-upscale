import { Chord, StringOctaveNote } from "@/app/data/notes";
import { FRET_COUNT, Neck } from "@/app/engine/generateNeckRepresentation";

export type SlashChord = {
  variation: Chord;
  bassNote: StringOctaveNote;
};

export function* getSlashChordsForVariation(
  chordVariation: Chord,
  neck: Neck,
  capo: number
): Generator<SlashChord | undefined> {
  const bassNoteStringIndex = lastNonUndefinedIndex(chordVariation);
  if (bassNoteStringIndex === -1) {
    return;
  }
  const bassNoteString = neck[bassNoteStringIndex];
  const minAllowedFretIndex = capo + 1;
  const maxAllowedFretIndex = FRET_COUNT - 1;

  // get the variation of chord with open string
  const openStringNote = bassNoteString[capo];
  if (openStringNote !== null) {
    yield getSlashChord(chordVariation, openStringNote);
  }

  for (
    let fretIndex = minAllowedFretIndex;
    fretIndex <= maxAllowedFretIndex;
    fretIndex++
  ) {
    const noteAtFret = bassNoteString[fretIndex];
    if (noteAtFret !== null) {
      yield getSlashChord(chordVariation, noteAtFret);
    }
  }
}

const getSlashChord = (
  chordVariation: Chord,
  bassNote: StringOctaveNote
): SlashChord | undefined => {
  if (chordVariation[bassNote.string]?.note === bassNote.note) {
    // no need to apply a slash chord when the bass note is the same as in the original chord
    return;
  }

  const chordCopy = [...chordVariation];
  chordCopy[bassNote.string] = bassNote; // prepend open string note
  return { variation: chordCopy, bassNote };
};

const lastNonUndefinedIndex = <T>(arr: (T | undefined)[]): number => {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] !== undefined) {
      return i;
    }
  }
  return -1; // Return -1 if all values are undefined
};
