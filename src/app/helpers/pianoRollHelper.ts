import { OctaveNote } from "@/app/data/notes";
import { allNotes, NOTE_HEIGHT } from "@/app/data/pianoRollConstants";

export const getPitchPosition = (octaveNote: OctaveNote): number => {
  const { octave, note } = octaveNote;
  const octavePosition = octave * allNotes.length * NOTE_HEIGHT;
  const notePosition = allNotes.indexOf(note) * NOTE_HEIGHT;

  return octavePosition + notePosition;
};
