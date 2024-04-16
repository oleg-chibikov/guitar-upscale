import { Soundfont } from "smplr";
import { OctaveNote, getNoteText } from "../data/notes";

let soundfont: Soundfont;

export const initSoundfont = () => {
  if (!soundfont) {
    const context = new AudioContext();
    soundfont = new Soundfont(context, {
      instrument: "acoustic_guitar_nylon",
      decayTime: 10,
      // kit: "FluidR3_GM", // "MusyngKite" is used by default if not specified
    });
  }
};

export const playNote = (note: OctaveNote, velocity: number) => {
  return soundfont?.start({
    note: getNoteText(note.note) + note.octave,
    velocity: velocity,
  });
};
