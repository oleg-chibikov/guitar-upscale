import { Note, OctaveNote } from "@/app/data/notes";
import { MAX_VOLUME } from "@/app/data/volume";
import { getLoadedInstrument, loadInstrument, playSound } from "./soundHelper";

export const loadMetronome = async () => {
  return await loadInstrument("woodblock", 0);
};

export const playMetronomeBeat = async (
  isAccented: boolean,
  baseVolume: number,
) => {
  const metronomeBeatNote: OctaveNote = {
    note: Note.C,
    octave: isAccented ? 5 : 4,
  };
  playSound(
    metronomeBeatNote,
    Math.min(baseVolume + (isAccented ? 20 : 0), MAX_VOLUME),
    getLoadedInstrument("woodblock", 0) ?? (await loadMetronome()),
    1000,
  );
};
