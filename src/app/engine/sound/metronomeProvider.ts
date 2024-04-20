import { Soundfont } from "smplr";
import { MAX_VELOCITY, Note, OctaveNote } from "../../data/notes";
import { playSound } from "./soundHelper";

let metronomeSoundfont: Soundfont;

export const initSoundfont = () => {
  const context = new AudioContext();

  metronomeSoundfont = new Soundfont(context, {
    instrument: "woodblock",
    kit: "FluidR3_GM", // "MusyngKite" is used by default if not specified
  });
};

export const playMetronomeTick = async (
  isAccented: boolean,
  baseVelocity: number
) => {
  if (!metronomeSoundfont) {
    initSoundfont();
  }
  // Adjust the note and velocity as needed for your metronome tick sound
  const metronomeTickNote: OctaveNote = {
    note: Note.C,
    octave: isAccented ? 5 : 4,
  };
  await playSound(
    metronomeTickNote,
    Math.min(baseVelocity + (isAccented ? 20 : 0), MAX_VELOCITY),
    metronomeSoundfont
  );
};
