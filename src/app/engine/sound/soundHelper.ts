import { OctaveNote, getNoteText } from "@/app/data/notes";
import { Soundfont } from "smplr";

export const playSound = async (
  note: OctaveNote,
  velocity: number,
  soundfont: Soundfont
) => {
  await soundfont.load;
  return soundfont.start({
    note: getNoteText(note.note) + note.octave,
    velocity: velocity,
  });
};
