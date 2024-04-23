import { MAX_VELOCITY, Note, OctaveNote } from "../../data/notes";
import { initSoundfont, playSound } from "./soundHelper";

export const playMetronomeTick = async (
  isAccented: boolean,
  baseVelocity: number
) => {
  // Adjust the note and velocity as needed for your metronome tick sound
  const metronomeTickNote: OctaveNote = {
    note: Note.C,
    octave: isAccented ? 5 : 4,
  };
  playSound(
    metronomeTickNote,
    Math.min(baseVelocity + (isAccented ? 20 : 0), MAX_VELOCITY),
    await initSoundfont("woodblock", 0),
    1000
  );
};
