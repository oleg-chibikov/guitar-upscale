import { addOrUpdateMapArray } from "@/app/helpers/mapHelper";
import {
  NOTE_COUNT,
  Note,
  OctaveNote,
  StringOctaveNote,
  serializeOctaveNote,
} from "../data/notes";

export type Neck = (StringOctaveNote | null)[][];
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
  baseNote: Note,
  capo: number
): Neck => {
  octaveNoteToStringOctaveNoteMap.clear();
  const neck: Neck = [];

  // going from the lowest string to the highest one
  for (let string = stringTuning.length - 1; string >= 0; string--) {
    const octaveNoteForString = stringTuning[string];
    const stringModifier = octaveNoteForString.note;
    neck[string] = [];
    let octave = octaveNoteForString.octave;

    for (let fret = 0; fret <= FRET_COUNT; fret++) {
      // Calculate the position on the neck for the current fret and string
      let position = (fret + stringModifier - baseNote) % NOTE_COUNT;

      // Ensure position is non-negative
      position = position < 0 ? NOTE_COUNT + position : position;

      // Check if the position is in the scale pattern
      const isInScale: boolean = scalePattern.has(position);

      const note = (position + baseNote) % NOTE_COUNT;

      if (note === Note.C) {
        octave++;
      }

      const stringOctaveNote = isInScale
        ? { note, octave, string: string, fret: fret }
        : null;
      neck[string][fret] = stringOctaveNote;

      if (stringOctaveNote !== null) {
        const serializedOctaveNote = serializeOctaveNote({ note, octave });
        if (fret >= capo) {
          addOrUpdateMapArray(
            octaveNoteToStringOctaveNoteMap,
            serializedOctaveNote,
            stringOctaveNote
          );
        }
      }
    }
  }

  return neck;
};
