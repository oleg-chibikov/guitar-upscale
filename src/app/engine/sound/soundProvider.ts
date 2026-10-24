import { Instrument } from "@/app/data/instruments";
import { OctaveNote } from "@/app/data/notes";
import { beatToMilliseconds } from "@/app/helpers/clockHelper";
import {
  instrumentValue,
  reverbStrengthValue,
  tempoBpmValue,
  volumeValue,
} from "@/app/store/settingsSlice";
import { getLoadedInstrument, loadInstrument, playSound } from "./soundHelper";

export const playNote = async (
  note: OctaveNote,
  volume?: number,
  instrument?: Instrument,
  reverbStrength?: number,
  durationMs?: number,
) => {
  const instrumentToPlay = instrument ?? instrumentValue;
  const reverb = reverbStrength ?? reverbStrengthValue;
  playSound(
    note,
    volume ?? volumeValue,
    getLoadedInstrument(instrumentToPlay, reverb) ??
      (await loadInstrument(instrumentToPlay, reverb)),
    durationMs ?? beatToMilliseconds(tempoBpmValue),
  );
};
