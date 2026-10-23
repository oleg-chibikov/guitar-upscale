import { Instrument } from "@/app/data/instruments";
import { OctaveNote } from "@/app/data/notes";
import { beatToMilliseconds } from "@/app/helpers/clockHelper";
import {
  instrumentValue,
  reverbStrengthValue,
  tempoBpmValue,
  volumeValue,
} from "@/app/store/settingsSlice";
import { loadInstrument, playSound } from "./soundHelper";

export const playNote = async (
  note: OctaveNote,
  volume?: number,
  instrument?: Instrument,
  reverbStrength?: number,
  durationMs?: number,
) => {
  playSound(
    note,
    volume ?? volumeValue,
    await loadInstrument(
      instrument ?? instrumentValue,
      reverbStrength ?? reverbStrengthValue,
    ),
    durationMs ?? beatToMilliseconds(tempoBpmValue),
  );
};
