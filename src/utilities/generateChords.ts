import { Note } from "@/app/data/notes";
import { CHROMATIC, SPECIAL, getScalePattern } from "@/app/data/scales";
import { getShiftedNote, parseStringToNotes } from "@/app/data/tunings";
import { generateNeckRepresentation } from "@/app/engine/generateNeckRepresentation";

const scalePattern = getScalePattern(SPECIAL, CHROMATIC); // all scales include 0, so it's omitted from the scales themselves
const tuning = "EBGDAE";

const baseNote = Note.E;
const neck = generateNeckRepresentation(
  scalePattern,
  parseStringToNotes(tuning),
  getShiftedNote(baseNote, tuning),
  baseNote
);

// const data = chordsGenerator.process(neck, true, 0);
// for (const noteMode of data) {
//   console.log(Note[noteMode.note]);
//   noteMode.modes.forEach((mode, i) => {
//     if (!mode) {
//       console.warn("No data for", chordModes[i]);
//       return;
//     }
//     console.log(mode.mode, mode.variations.length);
//   });
// }
