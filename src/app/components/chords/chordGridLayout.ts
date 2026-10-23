import { ChordModeVariations, getChordName } from "@/app/data/chordModes";
import { NOTE_COUNT, Note } from "@/app/data/notes";

export interface ChordGridCell {
  chordName: string;
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
  notes: Note[]
): ChordGridCell[] =>
  notes.flatMap((note, row) =>
    columns.map((mode, column) => ({
      chordName: getChordName(note, mode.chordMode),
      column,
      row,
      isDisabled: !isPlayable(mode, note),
    }))
  );

/**
 * One chord per scale note, from the root up: the first chord type that fits the scale.
 * The chords fill a column, then the next one.
 */
export const buildKeyChordsLayout = (
  columns: ChordModeVariations[],
  root: Note,
  rowsPerColumn: number
): ChordGridCell[] => {
  const chordNames: string[] = [];
  for (let step = 0; step < NOTE_COUNT; step++) {
    const note = (root + step) % NOTE_COUNT;
    const mode = columns.find((mode) => isPlayable(mode, note));
    if (mode) {
      chordNames.push(getChordName(note, mode.chordMode));
    }
  }
  return chordNames.map((chordName, index) => ({
    chordName,
    column: Math.floor(index / rowsPerColumn),
    row: index % rowsPerColumn,
    isDisabled: false,
  }));
};
