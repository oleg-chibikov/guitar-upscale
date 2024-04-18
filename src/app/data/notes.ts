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

export const MAX_VELOCITY = 127;

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

const noteLookup: { [key: string]: Note } = {
  E: Note.E,
  F: Note.F,
  "F#": Note["F#"],
  G: Note.G,
  "G#": Note["G#"],
  A: Note.A,
  "A#": Note["A#"],
  B: Note.B,
  C: Note.C,
  "C#": Note["C#"],
  D: Note.D,
  "D#": Note["D#"],
};

export function parseStringToNotes(input: string): OctaveNote[] {
  const notes: OctaveNote[] = [];

  const parts = input.split("|");
  const notesString = parts[0];
  const octavesString = parts[1];

  for (
    let i = 0, j = 0;
    i < notesString.length, j < octavesString.length;
    i++, j++
  ) {
    const thisChar = notesString[i];
    const nextChar = notesString[i + 1];
    const isSharp = nextChar === "#";
    const note = noteLookup[thisChar + (isSharp ? "#" : "")];
    if (isSharp) {
      i++;
    }
    const octave = parseInt(octavesString[j], 10);
    notes.push({ note, octave });
  }

  return notes;
}

export function getNoteText(noteNumber: number): string {
  if (noteNumber < 0 || noteNumber > 11) {
    throw new Error("Invalid note number");
  }

  const noteText = noteReverseMapping[noteNumber];
  if (noteText === undefined) {
    throw new Error("Note not found for the given number " + noteNumber);
  }

  return noteText;
}

export interface StringOctaveNote extends OctaveNote {
  string: number;
  fret: number;
}

export interface OctaveNote {
  octave: number;
  note: Note;
}

// TODO: Add enum with Tuning names
export const tunings: string[] = [
  "EBGDAE|544433",
  "EBGDAD|544433",
  "DAGDAD|544433",
];

export const serializeOctaveNote = (note: OctaveNote) =>
  [note.octave, note.note].join("_");

export const serializeStringOctaveNote = (note: StringOctaveNote) =>
  [note.string, note.octave, note.note].join("_");

export type Chord = StringOctaveNote[];
