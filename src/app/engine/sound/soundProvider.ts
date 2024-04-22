import { OctaveNote } from "@/app/data/notes";
import { Reverb, Soundfont } from "smplr";
import { playSound } from "./soundHelper";

let soundfont: Soundfont;

export const initSoundfont = () => {
  const context = new AudioContext();

  soundfont = new Soundfont(context, {
    instrument: "acoustic_guitar_nylon", // http://dev.music.free.fr/editors/abc_ui/tutos/soundfont.html
    kit: "FluidR3_GM", // "MusyngKite" is used by default if not specified
  });

  // if (!isMobileDevice()) {
  // very glitchy on the phone but works fine on web
  soundfont.output.addEffect("reverb", new Reverb(context), 0.7);
  // }
};

export const playNote = async (note: OctaveNote, velocity: number) => {
  if (!soundfont) {
    initSoundfont();
  }

  await playSound(note, velocity, soundfont);
};
