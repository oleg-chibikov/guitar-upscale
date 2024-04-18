import { Reverb, Soundfont } from "smplr";
import { MAX_VELOCITY, Note, OctaveNote, getNoteText } from "../data/notes";
import { isMobileDevice } from "../helpers/deviceHelper";

let soundfont: Soundfont;
let metronomeSoundfont: Soundfont;

export const initSoundfont = () => {
  const context = new AudioContext();

  soundfont = new Soundfont(context, {
    instrument: "acoustic_guitar_nylon", // http://dev.music.free.fr/editors/abc_ui/tutos/soundfont.html
    kit: "FluidR3_GM", // "MusyngKite" is used by default if not specified
  });

  if (!isMobileDevice()) {
    // very glitchy on the phone but works fine on web
    soundfont.output.addEffect("reverb", new Reverb(context), 0.5);
  }

  metronomeSoundfont = new Soundfont(context, {
    instrument: "woodblock",
    kit: "FluidR3_GM", // "MusyngKite" is used by default if not specified
  });
};

export const playNote = async (
  note: OctaveNote,
  velocity: number,
  metronome: boolean = false
) => {
  const instrument = metronome ? metronomeSoundfont : soundfont;
  await instrument.load;
  return instrument.start({
    note: getNoteText(note.note) + note.octave,
    velocity: velocity,
  });
};

export const playMetronomeTick = async (
  isAccented: boolean,
  baseVelocity: number
) => {
  // Adjust the note and velocity as needed for your metronome tick sound
  const metronomeTickNote: OctaveNote = {
    note: Note.C,
    octave: isAccented ? 5 : 4,
  };
  await playNote(
    metronomeTickNote,
    Math.min(baseVelocity + (isAccented ? 20 : 0), MAX_VELOCITY),
    true
  );
};
