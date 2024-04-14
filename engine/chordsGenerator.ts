import { Chord, Note, StringOctaveNote } from "../data/notes";
import {
  calculateAverage,
  findObjectWithMinValue,
} from "../helpers/arrayHelper";
import { Neck, NoteCount } from "./generateNeckRepresentation";

export enum ChordMode {
  Major,
  Minor,
  Diminished,
  Augmented,
  Suspended4,
  Suspended2,
  Fifth,
  Sixth,
  Seventh,
  SeventhMinor,
}

export const isAdvancedMode = (mode: ChordMode) =>
  mode !== ChordMode.Major && mode !== ChordMode.Minor;

export function getModeText(mode: ChordMode): string {
  switch (mode) {
    case ChordMode.Major:
      return "";
    case ChordMode.Minor:
      return "m";
    case ChordMode.Diminished:
      return "dim";
    case ChordMode.Augmented:
      return "aug";
    case ChordMode.Suspended4:
      return "sus4";
    case ChordMode.Suspended2:
      return "sus2";
    case ChordMode.Fifth:
      return "5";
    case ChordMode.Sixth:
      return "6";
    case ChordMode.Seventh:
      return "7";
    case ChordMode.SeventhMinor:
      return "7m";
  }
}

const chordModes = new Map<ChordMode, number[][]>([
  [
    ChordMode.Major,
    [
      [0, 7, 0, 4, 7, 0],
      [0, 4, 7, 0, 4, 0], // the first option doesn't cover standard C chord but this does
    ],
  ],
  [ChordMode.Minor, [[0, 7, 0, 3, 7, 0]]],
  [ChordMode.Diminished, [[0, 6, 0, 3, 7, 0]]],
  [ChordMode.Augmented, [[0, 8, 0, 4, 7, 0]]],
  [ChordMode.Suspended4, [[0, 5, 0, 5, 7, 0]]],
  [
    ChordMode.Suspended2,
    [
      [0, 7, 0, 2, 7, 0],
      [0, 7, 4, 2, 7, 0],
    ],
  ],
  [ChordMode.Fifth, [[0, 7, 0, 7, 7, 0]]],
  [ChordMode.Sixth, [[0, 7, 0, 4, 9, 0]]],
  [ChordMode.Seventh, [[0, 7, 0, 4, 10, 0]]],
  [ChordMode.SeventhMinor, [[0, 7, 10, 3, 10, 0]]],
]);

export type NoteChordMode = {
  mode: ChordMode;
  variations: Chord[];
};

export type NoteChords = {
  note: Note;
  modes: NoteChordMode[];
};

// Function to generate a chord based on the root note and the intervals
function generateChord(note: Note, intervals: number[]): Note[] {
  const chordNotes: Note[] = [];
  for (const interval of intervals) {
    const noteIndex = (note + interval) % 12;
    chordNotes.push(noteIndex);
  }
  return chordNotes;
}

// Function to find the next occurrence of a note in the chord on the given string within the specified range
const findNextNotesInChord = (
  stringIndex: number,
  fretIndex: number,
  noteToFind: Note,
  neck: Neck,
  maxFretDistance: number
): StringOctaveNote[] => {
  const notes = [];

  // Always take the open note into account
  const note = neck[stringIndex][0];
  if (note?.note === noteToFind) {
    notes.push(note);
  }

  for (
    let j = Math.max(1, fretIndex - maxFretDistance);
    j <= Math.min(fretIndex + maxFretDistance, neck[stringIndex].length - 1);
    j++
  ) {
    const note = neck[stringIndex][j];
    if (note?.note === noteToFind) {
      notes.push(note);
    }
  }
  return notes;
};

export const generateAllChords = (
  neck: Neck,
  useAdvancedChords: boolean
): NoteChords[] => {
  const allChords: NoteChords[] = [];

  // Loop through all notes
  for (let note = 0; note < NoteCount; note++) {
    const noteChords: NoteChordMode[] = [];

    // Generate all chord variations for the current note
    for (const [mode, intervals] of chordModes) {
      if (!useAdvancedChords && isAdvancedMode(mode)) {
        continue;
      }

      const chordVariations = intervals.flatMap((interval) =>
        generateChordVariations(note, interval, neck, mode, 4)
      );
      noteChords.push({ mode, variations: chordVariations });
    }

    // Add the generated chords for the current note to the result
    allChords.push({ note, modes: noteChords });
  }

  return allChords;
};

// https://stackoverflow.com/questions/12303989/cartesian-product-of-multiple-arrays-in-javascript
const cartesian = <T>(...args: T[][]): (T | null)[][] =>
  args.reduce<(T | null)[][]>(
    (acc, curr) => {
      if (!curr.length) {
        for (const item of acc) {
          item.push(null);
        }
        return acc;
      }
      return acc.flatMap((x) => curr.map((y) => [...x, y]));
    },
    [[]]
  );

// Function to generate all the variations of a chord on the guitar neck
const generateChordVariations = (
  baseNote: Note,
  interval: number[], // Notes that constitute the chord
  neck: Neck, // Representation of the guitar neck
  _mode: ChordMode, // needed here for debugging only
  minConsecutiveNotesInValidChord: number
): Chord[] => {
  const chordNotes = generateChord(baseNote, interval);
  const chordVariations: Chord[] = [];

  // Iterate through each string from bottom to top
  for (let stringIndex = neck.length - 1; stringIndex >= 0; stringIndex--) {
    const string = neck[stringIndex];

    // Find the first note in the chord on current string.
    for (let fretIndex = 0; fretIndex < NoteCount * 2; fretIndex++) {
      const stringOctaveNote = string[fretIndex];
      if (stringOctaveNote !== null && stringOctaveNote.note === baseNote) {
        const possibleNotesForThisBaseNote: StringOctaveNote[][] = [];
        possibleNotesForThisBaseNote.push([stringOctaveNote]);

        // Find the next notes in the chord on the upper strings
        for (let i = 1; i < chordNotes.length && stringIndex - i >= 0; i++) {
          const notesOnHigherString = findNextNotesInChord(
            stringIndex - i, // search for the next note on the next string
            fretIndex,
            chordNotes[i],
            neck,
            4
          );
          possibleNotesForThisBaseNote.push(notesOnHigherString);
        }

        if (
          possibleNotesForThisBaseNote.length < minConsecutiveNotesInValidChord
        ) {
          continue;
        }

        // cartesianProductOf([1, 2], [3, 4], ['a'])
        // -> [[1,3,"a"],[1,3,"b"],[1,4,"a"],[1,4,"b"],[2,3,"a"],[2,3,"b"],[2,4,"a"],[2,4,"b"]]

        const cartesianProduct = cartesian(...possibleNotesForThisBaseNote);
        console.log(cartesianProduct);
        if (cartesianProduct?.length) {
          for (const combination of cartesianProduct) {
            if (
              combination.length >= minConsecutiveNotesInValidChord &&
              // first 3 notes of the chord should be present to consider it valid
              // TODO: different modes of chord might require more notes
              [...combination]
                .reverse()
                .slice(0, minConsecutiveNotesInValidChord)
                .every((element) => element !== null)
            ) {
              // if (chordNotes[0] === Note.D && _mode === ChordMode.Minor) {
              //   debugger;
              // }
              chordVariations.push(combination.filter((x) => x) as Chord);
            }
          }
        }
      }
    }
  }

  return chordVariations;
};

export const getClosestVariation = (mode: NoteChordMode) => {
  if (!mode.variations.length) {
    return null;
  }
  const variationAvgDistances = mode.variations.map((variation) => {
    const distances = variation.map(
      // lower strings get more priority
      (note) => note.fret + (6 - note.string * 0.5)
    );
    const avgDistance = calculateAverage(distances);
    return { object: variation, number: avgDistance };
  });
  return findObjectWithMinValue(variationAvgDistances);
};
