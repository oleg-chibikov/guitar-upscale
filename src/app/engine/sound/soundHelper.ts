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
  resumeAudio();
  return soundfont.start({
    note: getNoteText(note.note) + note.octave,
    velocity: volume,
    duration: durationMs / 1000,
  });
};

const soundfontMap = new Map<string, Soundfont | SplendidGrandPiano>();

let audioContext: AudioContext | undefined;

// Phones only let audio start inside a tap. touchstart doesn't count, so a context made then stays suspended.
const resumeAudio = () => {
  if (audioContext && audioContext.state !== "running") {
    void audioContext.resume();
  }
};

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new AudioContext();
    // Lets iOS play sound with the silent switch on.
    const audioSession = (
      navigator as Navigator & { audioSession?: { type: string } }
    ).audioSession;
    if (audioSession) {
      audioSession.type = "playback";
    }
    for (const eventName of ["pointerup", "touchend", "click", "keydown"]) {
      document.addEventListener(eventName, resumeAudio, true);
    }
  }
  return audioContext;
};

export const loadInstrument = async (
  instrument: Instrument,
  reverbStrength: number
) => {
  const key = `${instrument}_${reverbStrength}`;
  let soundfont = soundfontMap.get(key);
  if (soundfont) {
    return soundfont;
  }
  const context = getAudioContext();

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
