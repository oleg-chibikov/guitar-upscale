import { ChordModeVariations, getChordName } from "@/app/data/chordModes";
import { NOTE_COUNT, Note } from "@/app/data/notes";

export interface ChordGridCell {
  chordName: string;
  root: Note;
  column: number;
  row: number;
  isDisabled: boolean;
}

const isPlayable = (mode: ChordModeVariations, note: Note) =>
  (mode.variationsByNote[note]?.length ?? 0) > 0;

/**
 * Every chord: one row per root note, one column per chord type.
 */
export const buildAllChordsLayout = (
  columns: ChordModeVariations[],
  notes: Note[],
): ChordGridCell[] =>
  notes.flatMap((note, row) =>
    columns.map((mode, column) => ({
      chordName: getChordName(note, mode.chordMode),
      root: note,
      column,
      row,
      isDisabled: !isPlayable(mode, note),
    })),
  );

/**
 * One chord per scale note, from the root up: the first chord type that fits the scale.
 * The chords fill a column, then the next one, in a grid as close to a square as they allow.
 */
export const buildKeyChordsLayout = (
  columns: ChordModeVariations[],
  root: Note,
): ChordGridCell[] => {
  const chords: { chordName: string; root: Note }[] = [];
  for (let step = 0; step < NOTE_COUNT; step++) {
    const note = (root + step) % NOTE_COUNT;
    const mode = columns.find((mode) => isPlayable(mode, note));
    if (mode) {
      chords.push({
        chordName: getChordName(note, mode.chordMode),
        root: note,
      });
    }
  }
  const columnCount = Math.ceil(Math.sqrt(chords.length));
  const rowsPerColumn = Math.ceil(chords.length / columnCount);
  return chords.map((chord, index) => ({
    ...chord,
    column: Math.floor(index / rowsPerColumn),
    row: index % rowsPerColumn,
    isDisabled: false,
  }));
};
