import { tuningValue } from "../store/settingsSlice";
import { NOTE_COUNT, Note, OctaveNote } from "./notes";

const OCTAVES_STING = "544433"; // octaves for notes in tuning
const BASE_TUNING_SHIFT = Note.E - Note.C;

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
  const octavesString = data.octaveNotes ?? OCTAVES_STING;

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
  const currentTuningShift = getCurrentShift();

  const withTuningShift =
    currentTuningShift !== undefined
      ? NOTE_COUNT + note + currentTuningShift
      : note;

  return (NOTE_COUNT + withTuningShift + BASE_TUNING_SHIFT) % NOTE_COUNT; // tuning shift is set for the base note E, not C
};

export const getUnshiftedNote = (note: Note) => {
  const currentTuningShift = getCurrentShift();

  const withTuningShift =
    currentTuningShift !== undefined
      ? NOTE_COUNT + note - currentTuningShift
      : note;

  return (NOTE_COUNT + withTuningShift - BASE_TUNING_SHIFT) % NOTE_COUNT; // tuning shift is set for the base note E, not C
};

export const getCurrentShift = () => tunings[tuningValue].shift;

interface TuningData {
  name: string;
  shift?: number;
  octaveNotes?: string;
}

export const tunings: { [key: string]: TuningData } = {
  EBGDAE: { name: "E" },
  EBGDAD: { name: "Drop D" },

  "EBEG#BE": { name: "Open E", octaveNotes: "655433" },
  DADGAD: { name: "Celtic E", octaveNotes: "655433" },
  DADDAD: { name: "Folk E" },
  EBEGBE: { name: "Cross note E" },

  "D#A#F#C#G#D#": { name: "D#", shift: -1, octaveNotes: "544433" },
  "D#A#F#C#G#C#": { name: "Drop C#", shift: -1, octaveNotes: "544433" },

  DAFCGD: { name: "D", shift: -2, octaveNotes: "544333" },
  DAFCGC: { name: "Drop C", shift: -2, octaveNotes: "544332" },

  "C#G#EBF#C#": { name: "C#", shift: -3, octaveNotes: "544332" },
  "C#G#EBF#B": { name: "Drop B", shift: -3, octaveNotes: "544332" },

  "CGD#A#FC": { name: "C", shift: -4, octaveNotes: "444332" },
  "CGD#A#FA#": { name: "Drop A#", shift: -4, octaveNotes: "444332" },
};

export type Tuning = Extract<keyof typeof tunings, string>;
