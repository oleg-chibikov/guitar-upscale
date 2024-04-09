import { Note, StringOctaveNote } from "../data/notes";
import { Neck } from "./generateNeckRepresentation";

export enum ChordMode {
  Major,
  Minor,
  Diminished,
  Augmented,
  Suspended4,
  Suspended2,
  Fifth,
  Fifth3Note,
  Sixth,
  Seventh,
  SeventhMinor,
}

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
    case ChordMode.Fifth3Note:
      return "5/3";
    case ChordMode.Sixth:
      return "6";
    case ChordMode.Seventh:
      return "7";
    case ChordMode.SeventhMinor:
      return "7m";
  }
}

const chordModes = new Map<ChordMode, number[]>([
  [ChordMode.Major, [0, 7, 0, 4, 7, 0]],
  [ChordMode.Minor, [0, 7, 0, 3, 7, 0]],
  [ChordMode.Diminished, [0, 6, 0, 3, 7, 0]],
  [ChordMode.Augmented, [0, 8, 0, 4, 7, 0]],
  [ChordMode.Suspended4, [0, 5, 0, 5, 7, 0]],
  [ChordMode.Suspended2, [0, 7, 0, 7, 7, 2]],
  [ChordMode.Fifth, [0, 7, 0, 7, 7, 0]],
  [ChordMode.Fifth3Note, [0, 7, 0]],
  [ChordMode.Sixth, [0, 7, 0, 4, 9, 0]],
  [ChordMode.Seventh, [0, 7, 0, 4, 10, 0]],
  [ChordMode.SeventhMinor, [0, 7, 10, 3, 10, 0]],
]);

export type NoteChordMode = {
  mode: ChordMode;
  variations: StringOctaveNote[][];
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

export const generateAllChords = (neck: Neck): NoteChords[] => {
  const allChords: NoteChords[] = [];

  // Loop through all notes
  for (let note = Note.E; note <= Note["D#"]; note++) {
    const noteChords: NoteChordMode[] = [];

    // Generate all chord variations for the current note
    for (const [mode, intervals] of chordModes) {
      const wrappedIntervals = intervals.map((interval) => interval % 12); // Ensure intervals wrap around 12
      const chordNotes = generateChord(note, wrappedIntervals);
      const chordVariations = generateChordVariations(chordNotes, neck);
      noteChords.push({ mode, variations: chordVariations });
    }

    // Add the generated chords for the current note to the result
    allChords.push({ note, modes: noteChords });
  }

  return allChords;
};

function generateCombinations<T>(
  arrays: T[][],
  currentCombination: T[] = [],
  currentIndex: number = 0,
  result: T[][] = []
) {
  if (currentIndex === arrays.length) {
    result.push(currentCombination.slice());
    return;
  }

  for (let i = 0; i < arrays[currentIndex].length; i++) {
    currentCombination[currentIndex] = arrays[currentIndex][i];
    generateCombinations(
      arrays,
      currentCombination.slice(),
      currentIndex + 1,
      result
    );
  }

  return result;
}

// Function to generate all the variations of a chord on the guitar neck
const generateChordVariations = (
  chordNotes: Note[], // Notes that constitute the chord
  neck: Neck // Representation of the guitar neck
): StringOctaveNote[][] => {
  const chordVariations: StringOctaveNote[][] = [];

  // Iterate through each string from bottom to top
  for (let stringIndex = neck.length - 1; stringIndex >= 0; stringIndex--) {
    const string = neck[stringIndex];

    // Find the first note in the chord on current string. Don't go over 15th string as not representative
    for (let fretIndex = 0; fretIndex < 15; fretIndex++) {
      const stringOctaveNote = string[fretIndex];
      if (
        stringOctaveNote !== null &&
        stringOctaveNote.note === chordNotes[0]
      ) {
        const variation: StringOctaveNote[][] = [];
        variation.push([stringOctaveNote]);

        // Find the next notes in the chord on the upper strings
        for (let i = 1; i < chordNotes.length && stringIndex - i >= 0; i++) {
          const nextNotes = findNextNotesInChord(
            stringIndex - i, // search for the next note on the next string
            fretIndex,
            chordNotes[i],
            neck,
            4
          );
          if (nextNotes.length) {
            variation.push(nextNotes);
          }
        }

        const combinations = generateCombinations(variation);
        if (combinations) {
          console.log(variation.length);
          for (const combination of combinations) {
            if (combination.length >= 3) {
              chordVariations.push(combination);
            }
          }
        }
      }
    }
  }

  return chordVariations;
};
