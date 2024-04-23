import { Instrument } from "@/app/data/instruments";
import { OctaveNote, getNoteText } from "@/app/data/notes";
import { isMobileDevice } from "@/app/helpers/deviceHelper";

export const playSound = (
  note: OctaveNote,
  velocity: number,
  soundfont: any,
  durationMs: number
) => {
  return soundfont.start({
    note: getNoteText(note.note) + note.octave,
    velocity: velocity,
    duration: durationMs / 1000,
  });
};

const soundfountMap = new Map<string, any>();

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

  if (reverbStrength && !isMobileDevice()) {
    const Reverb = (await import("smplr")).Reverb;
    // very glitchy on the phone but works fine on web
    soundfont.output.addEffect("reverb", new Reverb(context), reverbStrength);
  }

  soundfountMap.set(key, soundfont);

  await soundfont.load;
  return soundfont;
};
