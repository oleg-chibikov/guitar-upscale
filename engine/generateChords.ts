import { Note, StringOctaveNote } from "../data/notes";
import { Neck } from "./generateNeckRepresentation";

export enum ChordMode {
  Major,
  Minor,
  Diminished,
  Seventh,
  SeventhMinor,
  Sixth,
}

export function getModeText(mode: ChordMode): string {
  switch (mode) {
    case ChordMode.Major:
      return "";
    case ChordMode.Minor:
      return "m";
    case ChordMode.Diminished:
      return "dim";
    case ChordMode.Seventh:
      return "7";
    case ChordMode.SeventhMinor:
      return "7m";
    case ChordMode.Sixth:
      return "6";
  }
}

const chordModes = new Map<ChordMode, number[]>([
  [ChordMode.Major, [0, 7, 0, 4, 7, 0]],
  [ChordMode.Minor, [0, 7, 0, 3, 7, 0]],
  [ChordMode.Diminished, [0, 6, 0, 3, 7, 0]],
  [ChordMode.Seventh, [0, 7, 0, 4, 10, 0]],
  [ChordMode.SeventhMinor, [0, 7, 10, 3, 10, 0]],
  [ChordMode.Sixth, [0, 4, 7, 9, 2, 5]],
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
const findNextNoteInChord = (
  stringIndex: number,
  fretIndex: number,
  noteToFind: Note,
  neck: Neck,
  maxFretDistance: number
): StringOctaveNote | null => {
  // TODO: why only 4 strings?
  // TODO: we need to consider searching for 0 fret always
  for (
    let j = Math.max(0, fretIndex - maxFretDistance);
    j <= Math.min(fretIndex + maxFretDistance, neck[stringIndex].length - 1);
    j++
  ) {
    const note = neck[stringIndex][j];
    if (note?.note === noteToFind) {
      return note;
    }
  }
  return null;
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
        const variation: StringOctaveNote[] = [];
        variation.push(stringOctaveNote);

        // Find the next notes in the chord on the upper strings
        for (let i = 1; i < chordNotes.length && stringIndex - i >= 0; i++) {
          const nextNote = findNextNoteInChord(
            stringIndex - i, // search for the next note on the next string
            fretIndex,
            chordNotes[i],
            neck,
            4
          );
          if (nextNote !== null) {
            variation.push(nextNote);
          }
        }
        if (variation.length >= 3) {
          chordVariations.push(variation);
        }
      }
    }
  }

  return chordVariations;
};
