import { Soundfont } from "smplr";
import { OctaveNote, getNoteText } from "./data/notes";

const context = new AudioContext();
const soundfont = new Soundfont(context, {
  instrument: "acoustic_guitar_nylon",
  // kit: "FluidR3_GM", // "MusyngKite" is used by default if not specified
});

export const playNote = (note: OctaveNote) =>
  soundfont.start({
    note: getNoteText(note.note) + note.octave,
    velocity: 80,
  });
