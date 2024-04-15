import { Platform } from "react-native";
import { Soundfont } from "smplr";
import { OctaveNote, getNoteText } from "../data/notes";

let soundfont: Soundfont;
if (Platform.OS === "web") {
  const context = new AudioContext();
  soundfont = new Soundfont(context, {
    instrument: "acoustic_guitar_nylon",
    decayTime: 10,
    // kit: "FluidR3_GM", // "MusyngKite" is used by default if not specified
  });
}

export const playNote = (note: OctaveNote, velocity: number) =>
  Platform.OS === "web" &&
  soundfont.start({
    note: getNoteText(note.note) + note.octave,
    velocity: velocity,
  });
