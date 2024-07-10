import { MAX_STRING_INDEX_FOR_CHORD_GENERATION } from "@/app/data/chordsGeneratorTypes";
import { Note, StringOctaveNote } from "@/app/data/notes";
import { getPossibleFretRangeForChord } from "@/app/helpers/slashChordHelper";
import {
  capoValue,
  neckValue,
  slashChordBassNoteValue,
} from "@/app/store/settingsSlice";

const findClosestNote = (
  stringNotes: (StringOctaveNote | null)[],
  sourceNote: StringOctaveNote,
  targetNote: Note,
  minAllowedFretIndex: number,
  maxAllowedFretIndex: number
): StringOctaveNote | null => {
  const sourceIndex = stringNotes.findIndex(
    (note) =>
      note && note.string === sourceNote.string && note.fret === sourceNote.fret
  );

  if (sourceIndex === -1) return null;

  let leftIndex = sourceIndex;
  let rightIndex = sourceIndex;

  while (leftIndex >= 0 || rightIndex < stringNotes.length) {
    // Check left
    if (leftIndex >= 0) {
      const leftNote = stringNotes[leftIndex];
      if (
        leftNote &&
        leftNote.note === targetNote &&
        leftNote.fret >= minAllowedFretIndex &&
        leftNote.fret <= maxAllowedFretIndex
      ) {
        return leftNote;
      }
      leftIndex--;
    }

    // Check right
    if (rightIndex < stringNotes.length) {
      const rightNote = stringNotes[rightIndex];
      if (
        rightNote &&
        rightNote.note === targetNote &&
        rightNote.fret >= minAllowedFretIndex &&
        rightNote.fret <= maxAllowedFretIndex
      ) {
        return rightNote;
      }
      rightIndex++;
    }
  }

  return null;
};

export const replaceBassNoteWithSlash = (
  variationNotes: StringOctaveNote[]
) => {
  const bassNote = variationNotes[variationNotes.length - 1];
  const slashNote = slashChordBassNoteValue;
  const { minAllowedFretIndex, maxAllowedFretIndex } =
    getPossibleFretRangeForChord(variationNotes, capoValue);
  if (slashNote !== undefined && neckValue) {
    let closestSlashBassNote: StringOctaveNote | null = null;
    let minDistance = Infinity;

    // Search on the current string and lower strings
    for (
      let stringIndex = bassNote.string;
      stringIndex <
      Math.min(MAX_STRING_INDEX_FOR_CHORD_GENERATION + 1, neckValue.length);
      stringIndex++
    ) {
      const stringNotes = neckValue[stringIndex];

      // Check for "open" string (at capo position) first
      const capoNote = stringNotes[capoValue];
      if (
        stringIndex > bassNote.string &&
        capoNote &&
        capoNote.note === slashNote
      ) {
        closestSlashBassNote = {
          ...capoNote,
          string: stringIndex,
          fret: capoValue,
        };
        break; // Prefer "open" string (at capo position) on lower strings
      }

      const slashBassNote = findClosestNote(
        stringNotes,
        { ...bassNote, string: stringIndex },
        slashNote,
        minAllowedFretIndex,
        maxAllowedFretIndex
      );

      if (slashBassNote) {
        const distance = Math.abs(slashBassNote.fret - bassNote.fret);
        if (distance < minDistance) {
          minDistance = distance;
          closestSlashBassNote = { ...slashBassNote, string: stringIndex };
        }
      }
    }

    if (closestSlashBassNote) {
      // Remove the original bass note
      variationNotes.pop();

      // Add the new slash bass note
      variationNotes.push(closestSlashBassNote);
    }
  }
};
