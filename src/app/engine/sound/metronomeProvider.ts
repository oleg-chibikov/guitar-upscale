import { Note, OctaveNote } from "@/app/data/notes";
import { MAX_VOLUME } from "@/app/data/volume";
import { loadInstrument, playSound } from "./soundHelper";

export const loadMetronome = async () => {
  return await loadInstrument("woodblock", 0);
};

export const playMetronomeBeat = async (
  isAccented: boolean,
  baseVolume: number
) => {
  const metronomeBeatNote: OctaveNote = {
    note: Note.C,
    octave: isAccented ? 5 : 4,
  };
  playSound(
    metronomeBeatNote,
    Math.min(baseVolume + (isAccented ? 20 : 0), MAX_VOLUME),
    await loadMetronome(),
    1000
  );
};
