export const NOTE_COUNT: number = 12;
export const SHARP_NOTE_COUNT = 5;

export enum Note {
  C = 0,
  "C#" = 1,
  D = 2,
  "D#" = 3,
  E = 4,
  F = 5,
  "F#" = 6,
  G = 7,
  "G#" = 8,
  A = 9,
  "A#" = 10,
  B = 11,
}

const sharpNotes = new Set<Note>([
  Note["C#"],
  Note["D#"],
  Note["F#"],
  Note["G#"],
  Note["A#"],
]);

export const isSharp = (note: Note): boolean => sharpNotes.has(note);

export type OctaveNote = {
  octave: number;
  note: Note;
};

export type StringOctaveNote = OctaveNote & {
  string: number;
  fret: number;
};

// Reverse mapping object
const noteReverseMapping: { [key: number]: string } = {};
Object.keys(Note)
  .filter((key) => !isNaN(Number(Note[key as keyof typeof Note])))
  .forEach((key) => {
    const enumKey = key as keyof typeof Note;
    const enumValue = Note[enumKey];
    if (typeof enumValue === "number") {
      noteReverseMapping[enumValue] = enumKey;
    }
  });

export const getNoteText = (noteNumber: number): string => {
  // TODO: Note[noteNumber] should work
  if (noteNumber < 0 || noteNumber > 11) {
    throw new Error("Invalid note number");
  }

  const noteText = noteReverseMapping[noteNumber];
  if (noteText === undefined) {
    throw new Error("Note not found for the given number " + noteNumber);
  }

  return noteText;
};

export const serializeOctaveNote = (note: OctaveNote) =>
  [note.octave, note.note].join("_");

export const serializeStringOctaveNote = (note: StringOctaveNote) =>
  [note.string, note.octave, note.note].join("_");

export type Chord = FingerPosition[];
export type FingerPosition = StringOctaveNote | undefined; // represents a note in a chord on a particular string. Undefined means there is no note on that string

export const initNotesArray = <T>() =>
  Array.from({ length: NOTE_COUNT }, (_) => undefined as T);
