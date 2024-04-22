export enum Note {
  E = 0,
  F = 1,
  "F#" = 2,
  G = 3,
  "G#" = 4,
  A = 5,
  "A#" = 6,
  B = 7,
  C = 8,
  "C#" = 9,
  D = 10,
  "D#" = 11,
}

export interface StringOctaveNote extends OctaveNote {
  string: number;
  fret: number;
}

export interface OctaveNote {
  octave: number;
  note: Note;
}

export const MAX_VELOCITY = 127;
export const SHARP_NOTE_COUNT = 5;

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

export type Chord = StringOctaveNote[];
