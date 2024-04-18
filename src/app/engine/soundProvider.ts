import { Soundfont } from "smplr";
import { Note, OctaveNote, getNoteText } from "../data/notes";

let soundfont: Soundfont;
let metronomeSoundfond: Soundfont;

export const initSoundfont = () => {
  if (!soundfont) {
    const context = new AudioContext();
    soundfont = new Soundfont(context, {
      instrument: "acoustic_guitar_nylon",
      decayTime: 10,
      // kit: "FluidR3_GM", // "MusyngKite" is used by default if not specified
    });

    metronomeSoundfond = new Soundfont(context, {
      instrument: "woodblock",
      decayTime: 10,
      // kit: "FluidR3_GM", // "MusyngKite" is used by default if not specified
    });

    // test note
    soundfont?.start({
      note: "E4",
      velocity: 127,
    });
  }
};

export const playNote = (
  note: OctaveNote,
  velocity: number,
  metronome: boolean = false
) => {
  const instrument = metronome ? metronomeSoundfond : soundfont;
  return instrument?.start({
    note: getNoteText(note.note) + note.octave,
    velocity: velocity,
  });
};

export const playMetronomeTick = (
  isAccented: boolean,
  baseVelocity: number
) => {
  // Adjust the note and velocity as needed for your metronome tick sound
  const metronomeTickNote: OctaveNote = {
    note: Note.C,
    octave: isAccented ? 5 : 4,
  };
  playNote(
    metronomeTickNote,
    Math.min(baseVelocity + (isAccented ? 20 : 0), 127),
    true
  );
};
