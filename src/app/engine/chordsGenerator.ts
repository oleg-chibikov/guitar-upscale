import { Chord, Note, StringOctaveNote } from "../data/notes";
import {
  calculateAverage,
  findObjectWithMinValue,
} from "../helpers/arrayHelper";
import { NOTE_COUNT, Neck } from "./generateNeckRepresentation";

export enum ChordMode {
  Major,
  Minor,
  Diminished,
  Augmented,
  Augmented7,
  Suspended4,
  Suspended2,
  Fifth, // Power chord
  Sixth,
  SixthMinorMajor,
  SixthAdd9,
  SixthMinorAdd9,
  Seventh,
  SeventhMajor,
  SeventhMinor,
  SeventhMinorMajor,
  Ninth,
  NinthMajor,
  NinthMinor,
  NinthMinorMajor,
  Eleventh,
  EleventhMajor,
  EleventhMinor,
  EleventhMinorMajor,
  Add2,
  Add9,
  MinorAdd9,
  Hendrix,
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
    case ChordMode.Augmented7:
      return "aug7";
    case ChordMode.Suspended4:
      return "sus4";
    case ChordMode.Suspended2:
      return "sus2";
    case ChordMode.Fifth:
      return "5";
    case ChordMode.Sixth:
      return "6";
    case ChordMode.SixthMinorMajor:
      return "mM6";
    case ChordMode.SixthAdd9:
      return "6/9";
    case ChordMode.SixthMinorAdd9:
      return "6m/9";
    case ChordMode.Seventh:
      return "7";
    case ChordMode.SeventhMajor:
      return "M7";
    case ChordMode.SeventhMinor:
      return "m7";
    case ChordMode.SeventhMinorMajor:
      return "mM7";
    case ChordMode.Ninth:
      return "9";
    case ChordMode.NinthMajor:
      return "M9";
    case ChordMode.NinthMinor:
      return "m9";
    case ChordMode.NinthMinorMajor:
      return "mM9";
    case ChordMode.Eleventh:
      return "11";
    case ChordMode.EleventhMajor:
      return "M11";
    case ChordMode.EleventhMinor:
      return "m11";
    case ChordMode.EleventhMinorMajor:
      return "mM11";
    case ChordMode.Add2:
      return "/2";
    case ChordMode.Add9:
      return "/9";
    case ChordMode.MinorAdd9:
      return "m/9";
    case ChordMode.Hendrix:
      return "7#9";
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
  [
    ChordMode.Augmented7,
    [
      [0, 8, 10, 4, 7, 0],
      [0, 8, 10, 4, 10, 0],
      [0, 8, 0, 4, 10, 0],
    ],
  ],
  [ChordMode.Suspended4, [[0, 5, 0, 5, 7, 0]]],
  [
    ChordMode.Suspended2,
    [
      [0, 7, 0, 2, 7, 0],
      [0, 7, 4, 2, 7, 0],
    ],
  ],
  [ChordMode.Fifth, [[0, 7, 0, 7, 7, 0]]],
  [
    ChordMode.Sixth,
    [
      [0, 7, 0, 4, 9, 0],
      [0, 7, 0, 7, 9, 3],
    ],
  ],
  [
    ChordMode.SixthMinorMajor,
    [
      [0, 7, 0, 3, 9, 0],
      [0, 7, 0, 3, 9, 3],
      [0, 9, 0, 3, 7, 0],
    ],
  ],
  [ChordMode.SixthAdd9, [[0, 7, 2, 7, 9, 4]]],
  [ChordMode.SixthMinorAdd9, [[0, 7, 2, 7, 9, 3]]],
  [
    ChordMode.Seventh,
    [
      [0, 7, 10, 4, 7, 0],
      [0, 7, 0, 4, 10, 0],
    ],
  ],
  [ChordMode.SeventhMajor, [[0, 7, 11, 4, 7, 0]]],
  [ChordMode.SeventhMinor, [[0, 7, 10, 3, 7, 0]]],
  [ChordMode.SeventhMinorMajor, [[0, 7, 11, 3, 7, 0]]],
  [
    ChordMode.Ninth,
    [
      [0, 7, 10, 4, 7, 2],
      [0, 7, 2, 7, 10, 4],
    ],
  ],
  [ChordMode.NinthMajor, [[0, 7, 11, 4, 7, 2]]],
  [
    ChordMode.NinthMinor,
    [
      [0, 7, 10, 3, 7, 2],
      [0, 7, 10, 3, 10, 2],
      [0, 7, 0, 3, 10, 2],
    ],
  ],
  [ChordMode.NinthMinorMajor, [[0, 7, 11, 3, 7, 2]]],
  [
    ChordMode.Eleventh,
    [
      [0, 5, 10, 4, 7, 2],
      [0, 5, 2, 7, 10, 4],
    ],
  ],
  [ChordMode.EleventhMajor, [[0, 5, 11, 4, 7, 2]]],
  [
    ChordMode.EleventhMinor,
    [
      [0, 5, 10, 3, 7, 2],
      [0, 7, 2, 5, 10, 3],
    ],
  ],
  [ChordMode.EleventhMinorMajor, [[0, 5, 11, 3, 7, 2]]],
  [ChordMode.Add2, [[0, 7, 2, 4, 7, 0]]],
  [
    ChordMode.Add9,
    [
      [0, 7, 0, 4, 7, 2],
      [0, 7, 2, 7, 7, 4],
    ],
  ],
  [
    ChordMode.MinorAdd9,
    [
      [0, 7, 0, 3, 7, 2],
      [0, 7, 2, 7, 7, 3],
    ],
  ],
  [
    ChordMode.Hendrix,
    [
      [0, 0, 4, 10, 3, 0],
      [0, 7, 10, 4, 10, 3],
    ],
  ], // [0, 7, 0, 4, 7, 0],
]);

const chordModesArray = Array.from(chordModes);

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
  baseFretIndex: number, // we allow not more than maxFretDistance distance from this fret in any direction unless it's 0 (then any can suit)
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
    let j = Math.max(1, baseFretIndex - maxFretDistance);
    j <=
    Math.min(
      baseFretIndex === 0 ? NOTE_COUNT - 1 : baseFretIndex + maxFretDistance, // if the note on the previous string was open (fret index) - then we search for the next base fret index on the next string (therefore allowing any fret of the first octave 0 - 11)
      neck[stringIndex].length - 1
    );
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
  for (let note = 0; note < NOTE_COUNT; note++) {
    const noteChords: NoteChordMode[] = [];

    // Generate all chord variations for the current note
    for (const [mode, intervals] of chordModesArray) {
      if (!useAdvancedChords && isAdvancedMode(mode)) {
        continue;
      }

      const chordVariations = intervals.flatMap((interval) =>
        generateChordVariations(note, interval, neck, mode)
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
  _mode: ChordMode // needed here for debugging only
): Chord[] => {
  const minConsecutiveNotesInValidChord = 4;
  const chordNotes = generateChord(baseNote, interval);
  const chordVariations: Chord[] = [];

  // Iterate through each string from bottom to top
  for (let stringIndex = neck.length - 1; stringIndex >= 0; stringIndex--) {
    const string = neck[stringIndex];

    // Find the first note in the chord on current string - limit at 12 to avoid unrealistic chords
    for (let fretIndex = 0; fretIndex < NOTE_COUNT; fretIndex++) {
      const stringOctaveNote = string[fretIndex];
      if (stringOctaveNote !== null && stringOctaveNote.note === baseNote) {
        const possibleNotesForThisBaseNote: StringOctaveNote[][] = [];
        possibleNotesForThisBaseNote.push([stringOctaveNote]);

        let baseFretIndex = fretIndex;

        // Find the next notes in the chord on the upper strings

        // if (chordNotes[0] === Note.E && _mode === ChordMode.Major) {
        //   debugger;
        // }
        for (let i = 1; i < chordNotes.length && stringIndex - i >= 0; i++) {
          const notesOnHigherString = findNextNotesInChord(
            stringIndex - i, // search for the next note on the next string
            baseFretIndex,
            chordNotes[i],
            neck,
            4
          );

          // If the previous fret index was an open string (0) then we need to set a new base fret index on a higher string to arrange fingers
          // Once the index is found - it remains base for the whole chord
          // Without this it's not possible to arrange fingers for a Hendrix chord whic is 0 on last string and 7 on last but one

          if (baseFretIndex === 0) {
            for (const note of notesOnHigherString) {
              if (note.fret > 0 && note.fret < NOTE_COUNT) {
                baseFretIndex = note.fret;
                break;
              }
            }
          }
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
        // console.log(cartesianProduct);
        if (cartesianProduct?.length) {
          for (const combination of cartesianProduct) {
            if (
              combination.length >= minConsecutiveNotesInValidChord &&
              // first n notes of the chord should be present to consider it valid
              // TODO: different modes of chord might require more notes
              [...combination]
                .slice(0, minConsecutiveNotesInValidChord)
                .every((element) => element !== null)
            ) {
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
