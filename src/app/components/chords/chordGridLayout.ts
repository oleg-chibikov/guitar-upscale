import { ChordModeVariations, getChordName } from "@/app/data/chordModes";
import { ChordPlayMode } from "@/app/data/chordPlayMode";
import { NOTE_COUNT, Note } from "@/app/data/notes";
import { hasVariationForPlayMode } from "@/app/engine/chords/chordVariationHelper";

export interface ChordGridCell {
  chordName: string;
  root: Note;
  column: number;
  row: number;
  isDisabled: boolean;
}

const isPlayable = (mode: ChordModeVariations, note: Note) =>
  (mode.variationsByNote[note]?.length ?? 0) > 0;

const isPlayableIn = (
  playMode: ChordPlayMode,
  mode: ChordModeVariations,
  note: Note,
) => hasVariationForPlayMode(mode.variationsByNote[note] ?? [], playMode);

/**
 * Every chord: one row per root note, one column per chord type.
 * A chord without a shape for the play mode is greyed out.
 */
export const buildAllChordsLayout = (
  columns: ChordModeVariations[],
  notes: Note[],
  playMode: ChordPlayMode,
): ChordGridCell[] =>
  notes.flatMap((note, row) =>
    columns.map((mode, column) => ({
      chordName: getChordName(note, mode.chordMode),
      root: note,
      column,
      row,
      isDisabled: !isPlayableIn(playMode, mode, note),
    })),
  );

const PERFECT_FIFTH = 7;

const isSeventhChord = ({ chordMode }: ChordModeVariations) =>
  chordMode.intervals.length === 4 &&
  (chordMode.intervals.includes(10) || chordMode.intervals.includes(11));

/**
 * One chord per scale note, from the root up: the first chord type that fits the scale.
 * The chords fill a row, then the next one, in a grid as close to a square as they allow.
 * The empty cells left in the last row get a seventh chord on the root, then on the fifth.
 * A chord without a shape for the play mode keeps its place and is greyed out.
 */
export const buildKeyChordsLayout = (
  columns: ChordModeVariations[],
  root: Note,
  playMode: ChordPlayMode,
): ChordGridCell[] => {
  const chords: {
    chordName: string;
    root: Note;
    mode: ChordModeVariations;
  }[] = [];
  const modeByNote = new Map<Note, ChordModeVariations>();
  for (let step = 0; step < NOTE_COUNT; step++) {
    const note = (root + step) % NOTE_COUNT;
    const mode = columns.find((mode) => isPlayable(mode, note));
    if (mode) {
      modeByNote.set(note, mode);
      chords.push({
        chordName: getChordName(note, mode.chordMode),
        root: note,
        mode,
      });
    }
  }
  const columnCount = Math.ceil(Math.sqrt(chords.length));
  const emptyCells =
    (columnCount - (chords.length % columnCount)) % columnCount;
  const extras = [root, (root + PERFECT_FIFTH) % NOTE_COUNT]
    .flatMap((note) => {
      const mode = columns.find(
        (mode) =>
          mode !== modeByNote.get(note) &&
          isSeventhChord(mode) &&
          isPlayable(mode, note),
      );
      return modeByNote.has(note) && mode
        ? [{ chordName: getChordName(note, mode.chordMode), root: note, mode }]
        : [];
    })
    .slice(0, emptyCells);
  return [...chords, ...extras].map(({ chordName, root, mode }, index) => ({
    chordName,
    root,
    column: index % columnCount,
    row: Math.floor(index / columnCount),
    isDisabled: !isPlayableIn(playMode, mode, root),
  }));
};
