import { Instrument } from "@/app/data/instruments";
import { OctaveNote, getNoteText } from "@/app/data/notes";
import { isMobileDevice } from "@/app/helpers/deviceHelper";
import { Reverb, Soundfont } from "smplr";

export const playSound = (
  note: OctaveNote,
  velocity: number,
  soundfont: Soundfont,
  durationMs: number
) => {
  return soundfont.start({
    note: getNoteText(note.note) + note.octave,
    velocity: velocity,
    duration: durationMs / 1000,
  });
};

const soundfountMap = new Map<string, Soundfont>();

export const initSoundfont = async (
  instrument: Instrument,
  reverbStrength: number
) => {
  const key = instrument + "_" + reverbStrength;
  let soundfont = soundfountMap.get(key);
  if (soundfont) {
    return soundfont;
  }
  const context = new AudioContext();

  soundfont = new Soundfont(context, {
    instrument: instrument,
    // kit: "FluidR3_GM", // "MusyngKite" is used by default if not specified
  });

  if (reverbStrength && !isMobileDevice()) {
    // very glitchy on the phone but works fine on web
    soundfont.output.addEffect("reverb", new Reverb(context), reverbStrength);
  }

  soundfountMap.set(key, soundfont);

  await soundfont.load;
  return soundfont;
};
