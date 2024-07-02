import { generateAllTunings } from "@/app/engine/tuningBuilder";
import { NOTE_COUNT, Note, OctaveNote } from "./notes";

const BASE_TUNING_SHIFT = Note.E - Note.C;

export function getOctaveNotesForTuning(tuningKey: Tuning): OctaveNote[] {
  return tunings[tuningKey].octaveNotes;
}

export const getShiftedNote = (note: Note, tuning: Tuning) => {
  const currentTuningShift = getCurrentShift(tuning);
  return getShiftedNoteCore(note, currentTuningShift);
};

export const getUnshiftedNote = (note: Note, tuning: Tuning) => {
  const currentTuningShift = getCurrentShift(tuning);
  return getUnshiftedNoteCore(note, currentTuningShift);
};

export const getShiftedNoteCore = (note: Note, shift?: number) => {
  const withTuningShift =
    shift !== undefined ? NOTE_COUNT + note + shift : note;

  return (NOTE_COUNT + withTuningShift + BASE_TUNING_SHIFT) % NOTE_COUNT; // tuning shift is set for the base note E, not C
};

export const getUnshiftedNoteCore = (note: Note, shift?: number) => {
  const withTuningShift =
    shift !== undefined ? NOTE_COUNT + note - shift : note;

  return (NOTE_COUNT + withTuningShift - BASE_TUNING_SHIFT) % NOTE_COUNT; // tuning shift is set for the base note E, not C
};

export const getCurrentShift = (tuning: Tuning) => tunings[tuning].shift;

export const tunings = generateAllTunings();

export type Tuning = Extract<keyof typeof tunings, string>;
