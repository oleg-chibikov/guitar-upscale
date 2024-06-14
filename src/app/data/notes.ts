import { NOTE_COUNT } from "@/app/engine/generateNeckRepresentation";

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

export type OctaveNote = {
  octave: number;
  note: Note;
};

export type StringOctaveNote = OctaveNote & {
  string: number;
  fret: number;
};

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

export const initNotesArray = <T>() =>
  Array.from({ length: NOTE_COUNT }, (_) => undefined as T);
