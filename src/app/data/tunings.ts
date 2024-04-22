import { Note, OctaveNote } from "./notes";

const OCTAVES_STING = "544433"; // octaves for notes in tuning

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

export function parseStringToNotes(notesString: Tuning): OctaveNote[] {
  const notes: OctaveNote[] = [];

  const octavesString = OCTAVES_STING; // might be omitted and defaults to 544433

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
// TODO: Add enum with Tuning names
export const tunings = {
  EBGDAE: "Standard E",
  EBGDAD: "Drop E",
  "EBEG#BE": "Open E",
  DADGAD: "Celtic",
  DADDAD: "Folk",
  EBEGBE: "Cross note E",
};

export type Tuning = keyof typeof tunings;
