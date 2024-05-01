import { MAX_VELOCITY, Note, OctaveNote } from "../../data/notes";
import { loadInstrument, playSound } from "./soundHelper";

export const loadMetronome = async () => {
  return await loadInstrument("woodblock", 0);
};

export const playMetronomeBeat = async (
  isAccented: boolean,
  baseVelocity: number
) => {
  const metronomeBeatNote: OctaveNote = {
    note: Note.C,
    octave: isAccented ? 5 : 4,
  };
  playSound(
    metronomeBeatNote,
    Math.min(baseVelocity + (isAccented ? 20 : 0), MAX_VELOCITY),
    await loadMetronome(),
    1000
  );
};
