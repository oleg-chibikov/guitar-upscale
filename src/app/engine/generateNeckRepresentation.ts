import {
  Note,
  OctaveNote,
  StringOctaveNote,
  serializeOctaveNote,
} from "../data/notes";

export type Neck = (StringOctaveNote | null)[][];
export const NOTE_COUNT: number = 12;
export const FRET_COUNT: number = NOTE_COUNT * 2;

// This map helps getting the notes on the fret based on just notes.
// Each note has several positions on the fret. The map contains them all
export const octaveNoteToStringOctaveNoteMap = new Map<
  string,
  StringOctaveNote[]
>();

export const generateNeckRepresentation = (
  scalePattern: Set<Note>,
  stringTuning: OctaveNote[],
  baseNote: Note
): Neck => {
  octaveNoteToStringOctaveNoteMap.clear();
  const neck: Neck = [];

  // going from the lowest string to the highest one
  for (let i = stringTuning.length - 1; i >= 0; i--) {
    const octaveNoteForString = stringTuning[i];
    const stringModifier = octaveNoteForString.note;
    neck[i] = [];
    let octave = octaveNoteForString.octave;

    for (let j = 0; j <= FRET_COUNT; j++) {
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

      const stringOctaveNote = isInScale
        ? { note, octave, string: i, fret: j }
        : null;
      neck[i][j] = stringOctaveNote;

      if (stringOctaveNote !== null) {
        const serializedOctaveNote = serializeOctaveNote({ note, octave });
        const stringOctaveNotesArray =
          octaveNoteToStringOctaveNoteMap.get(serializedOctaveNote) ?? [];
        stringOctaveNotesArray.push(stringOctaveNote);
        octaveNoteToStringOctaveNoteMap.set(
          serializedOctaveNote,
          stringOctaveNotesArray
        );
      }
    }
  }

  return neck;
};
