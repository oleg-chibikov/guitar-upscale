import { Reverb, Soundfont } from "smplr";
import { MAX_VELOCITY, Note, OctaveNote, getNoteText } from "../data/notes";

let soundfont: Soundfont;
let metronomeSoundfond: Soundfont;

export const initSoundfont = () => {
  if (!soundfont) {
    const context = new AudioContext();
    const emptySource = context.createBufferSource();
    emptySource.start();
    emptySource.stop();
    soundfont = new Soundfont(context, {
      instrument: "acoustic_guitar_nylon", // http://dev.music.free.fr/editors/abc_ui/tutos/soundfont.html
      decayTime: 10,
      // kit: "FluidR3_GM", // "MusyngKite" is used by default if not specified
    });
    soundfont.output.addEffect("reverb", new Reverb(context), 0.4);

    metronomeSoundfond = new Soundfont(context, {
      instrument: "woodblock",
      decayTime: 10,
      // kit: "FluidR3_GM", // "MusyngKite" is used by default if not specified
    });

    // test note
    soundfont?.start({
      note: "E4",
      velocity: MAX_VELOCITY,
    });
  }
};

export const playNote = (
  note: OctaveNote,
  velocity: number,
  metronome: boolean = false
) => {
  const instrument = metronome ? metronomeSoundfond : soundfont;
  return instrument?.start({
    note: getNoteText(note.note) + note.octave,
    velocity: velocity,
  });
};

export const playMetronomeTick = (
  isAccented: boolean,
  baseVelocity: number
) => {
  // Adjust the note and velocity as needed for your metronome tick sound
  const metronomeTickNote: OctaveNote = {
    note: Note.C,
    octave: isAccented ? 5 : 4,
  };
  playNote(
    metronomeTickNote,
    Math.min(baseVelocity + (isAccented ? 20 : 0), MAX_VELOCITY),
    true
  );
};
