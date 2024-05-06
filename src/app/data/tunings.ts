import { NOTE_COUNT } from "../engine/generateNeckRepresentation";
import { tuningValue } from "../store/settingsSlice";
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

export function parseStringToNotes(tuningKey: Tuning): OctaveNote[] {
  const notes: OctaveNote[] = [];

  const data = tunings[tuningKey];
  const octavesString = data.shift == -2 ? "544333" : OCTAVES_STING;

  for (
    let i = 0, j = 0;
    i < tuningKey.length, j < octavesString.length;
    i++, j++
  ) {
    const thisChar = tuningKey[i];
    const nextChar = tuningKey[i + 1];
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

export const getShiftedNote = (note: Note) => {
  const tuningData = tunings[tuningValue];

  return tuningData.shift
    ? (NOTE_COUNT + note + tuningData.shift) % NOTE_COUNT
    : note;
};

interface TuningData {
  name: string;
  shift?: number;
}

export const tunings: { [key: string]: TuningData } = {
  EBGDAE: { name: "Standard E" },
  EBGDAD: { name: "Drop E" },
  "EBEG#BE": { name: "Open E" },
  DADGAD: { name: "Celtic E" },
  DADDAD: { name: "Folk E" },
  EBEGBE: { name: "Cross note E" },
  DAFCGD: { name: "Standard D", shift: -2 },
  DAFCGC: { name: "Drop D", shift: -2 },
};

export type Tuning = Extract<keyof typeof tunings, string>;
