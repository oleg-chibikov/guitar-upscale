import { Instrument } from "@/app/data/instruments";
import { OctaveNote, getNoteText } from "@/app/data/notes";
import { isMobileDeviceValue } from "@/app/helpers/deviceHelper";
import { Soundfont, SplendidGrandPiano } from "smplr";

export const playSound = (
  note: OctaveNote,
  volume: number,
  soundfont: Soundfont | SplendidGrandPiano,
  durationMs: number
) => {
  return soundfont.start({
    note: getNoteText(note.note) + note.octave,
    velocity: volume,
    duration: durationMs / 1000,
  });
};

const soundfontMap = new Map<string, Soundfont | SplendidGrandPiano>();

export const loadInstrument = async (
  instrument: Instrument,
  reverbStrength: number
) => {
  const key = instrument + "_" + reverbStrength;
  let soundfont = soundfontMap.get(key);
  if (soundfont) {
    return soundfont;
  }
  const context = new AudioContext();

  if (instrument === "sampled_piano") {
    const SplendidGrandPiano = (await import("smplr")).SplendidGrandPiano;
    soundfont = new SplendidGrandPiano(context);
  } else {
    const Soundfont = (await import("smplr")).Soundfont;
    soundfont = new Soundfont(context, {
      instrument: instrument,
      // kit: "FluidR3_GM", // "MusyngKite" is used by default if not specified
    });
  }

  if (reverbStrength && !isMobileDeviceValue) {
    const Reverb = (await import("smplr")).Reverb;
    // very glitchy on the phone but works fine on web
    soundfont.output.addEffect("reverb", new Reverb(context), reverbStrength);
  }

  soundfontMap.set(key, soundfont);

  await soundfont.load;
  return soundfont;
};
