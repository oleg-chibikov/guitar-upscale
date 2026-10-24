import { Instrument } from "@/app/data/instruments";
import { OctaveNote, getNoteText } from "@/app/data/notes";
import { isMobileDeviceValue } from "@/app/helpers/deviceHelper";
import type { Soundfont, SplendidGrandPiano, Storage } from "smplr";

// Shared with public/sw.js, which keeps this cache when it clears its own
const SAMPLE_CACHE = "smplr";

// Keeps the samples across visits and offline. smplr's own CacheStorage also
// keeps failed answers, and then a sound would stay broken for good.
const sampleStorage: Storage = {
  fetch: async (url) => {
    // No Cache API outside https, as on a phone on the LAN
    if (typeof caches === "undefined") {
      return fetch(url);
    }
    const cache = await caches.open(SAMPLE_CACHE).catch(() => undefined);
    const cached = await cache?.match(url);
    if (cached) {
      return cached;
    }
    const response = await fetch(url);
    if (response.ok && cache) {
      await cache.put(url, response.clone()).catch(() => {});
    }
    return response;
  },
};

export const playSound = (
  note: OctaveNote,
  volume: number,
  soundfont: Soundfont | SplendidGrandPiano,
  durationMs: number,
) => {
  resumeAudio();
  return soundfont.start({
    note: getNoteText(note.note) + note.octave,
    velocity: volume,
    duration: durationMs / 1000,
  });
};

const soundfontMap = new Map<string, Soundfont | SplendidGrandPiano>();
// only the instruments whose samples have finished loading
const loadedSoundfontMap = new Map<string, Soundfont | SplendidGrandPiano>();

const getInstrumentKey = (instrument: Instrument, reverbStrength: number) =>
  `${instrument}_${reverbStrength}`;

// awaiting even a loaded instrument lets queued work run first, and the note comes late
export const getLoadedInstrument = (
  instrument: Instrument,
  reverbStrength: number,
) => loadedSoundfontMap.get(getInstrumentKey(instrument, reverbStrength));

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
  reverbStrength: number,
) => {
  const key = getInstrumentKey(instrument, reverbStrength);
  let soundfont = soundfontMap.get(key);
  if (soundfont) {
    return soundfont;
  }
  const context = getAudioContext();

  if (instrument === "sampled_piano") {
    const SplendidGrandPiano = (await import("smplr")).SplendidGrandPiano;
    soundfont = new SplendidGrandPiano(context, { storage: sampleStorage });
  } else {
    const Soundfont = (await import("smplr")).Soundfont;
    soundfont = new Soundfont(context, {
      instrument: instrument,
      storage: sampleStorage,
      // kit: "FluidR3_GM", // "MusyngKite" is used by default if not specified
    });
  }

  if (reverbStrength && !isMobileDeviceValue) {
    const Reverb = (await import("smplr")).Reverb;
    // very glitchy on the phone but works fine on web
    soundfont.output.addEffect("reverb", new Reverb(context), reverbStrength);
  }

  soundfontMap.set(key, soundfont);

  try {
    await soundfont.load;
  } catch (error) {
    // a failed download gets another try on the next call
    soundfontMap.delete(key);
    throw error;
  }
  loadedSoundfontMap.set(key, soundfont);
  return soundfont;
};
