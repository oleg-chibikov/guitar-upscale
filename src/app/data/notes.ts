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

export const getNoteText = (noteNumber: number): string => {
  return Note[noteNumber];
};

export const serializeOctaveNote = (note: OctaveNote) =>
  getNoteText(note.note) + note.octave;

export const serializeStringOctaveNote = (note: StringOctaveNote) =>
  [note.string, note.octave, note.note].join("_");

export type Chord = NoteInChord[];
export type NoteInChord = StringOctaveNote | undefined; // represents a note in a chord on a particular string. Undefined means there is no note on that string

export const initNotesArray = <T>() =>
  Array.from({ length: NOTE_COUNT }, () => undefined as T);

export type Neck = (StringOctaveNote | null)[][];
export const FRET_COUNT: number = NOTE_COUNT * 2;
