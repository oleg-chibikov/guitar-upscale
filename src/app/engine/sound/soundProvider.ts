import { Instrument } from "@/app/data/instruments";
import { OctaveNote } from "@/app/data/notes";
import { loadInstrument, playSound } from "./soundHelper";

export const playNote = async (
  note: OctaveNote,
  volume: number,
  instrument: Instrument,
  reverbStrength: number,
  durationMs: number
) => {
  playSound(
    note,
    volume,
    await loadInstrument(instrument, reverbStrength),
    durationMs
  );
};
