import { Note, OctaveNote, StringOctaveNote } from "../data/notes";

export type Neck = (StringOctaveNote | null)[][];
export const NoteCount: number = 12;

export const generateNeckRepresentation = (
  scalePattern: Set<Note>,
  stringTuning: OctaveNote[],
  baseNote: Note
): Neck => {
  const neck: Neck = [];

  for (let i = stringTuning.length - 1; i >= 0; i--) {
    const octaveNoteForString = stringTuning[i];
    const stringModifier = octaveNoteForString.note;
    neck[i] = [];
    let octave = octaveNoteForString.octave;

    for (let j = 0; j <= NoteCount * 2; j++) {
      // Calculate the position on the neck for the current fret and string
      let position = (j + stringModifier - baseNote) % NoteCount;

      // Ensure position is non-negative
      position = position < 0 ? NoteCount + position : position;

      // Check if the position is in the scale pattern
      const isInScale: boolean = scalePattern.has(position);

      const note = (position + baseNote) % NoteCount;

      if (note === Note.C) {
        octave++;
      }

      neck[i][j] = isInScale ? { note, octave, string: i } : null;
    }
  }

  return neck;
};
