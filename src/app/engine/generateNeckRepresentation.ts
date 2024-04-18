import { Note, OctaveNote, StringOctaveNote } from "../data/notes";

export type Neck = (StringOctaveNote | null)[][];
export const NOTE_COUNT: number = 12;

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

    for (let j = 0; j <= NOTE_COUNT * 2; j++) {
      // Calculate the position on the neck for the current fret and string
      let position = (j + stringModifier - baseNote) % NOTE_COUNT;

      // Ensure position is non-negative
      position = position < 0 ? NOTE_COUNT + position : position;

      // Check if the position is in the scale pattern
      const isInScale: boolean = scalePattern.has(position);

      const note = (position + baseNote) % NOTE_COUNT;

      if (note === Note.C) {
        octave++;
      }

      neck[i][j] = isInScale ? { note, octave, string: i, fret: j } : null;
    }
  }

  return neck;
};
