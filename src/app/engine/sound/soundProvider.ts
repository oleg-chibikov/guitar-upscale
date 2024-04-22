import { Instrument } from "@/app/data/instruments";
import { OctaveNote } from "@/app/data/notes";
import { initSoundfont, playSound } from "./soundHelper";

export const playNote = async (
  note: OctaveNote,
  velocity: number,
  instrument: Instrument,
  reverbStrength: number
) => {
  playSound(note, velocity, await initSoundfont(instrument, reverbStrength));
};
