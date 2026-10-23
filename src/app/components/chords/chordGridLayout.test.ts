import { ChordMode, ChordModeVariations } from "@/app/data/chordModes";
import { NOTE_COUNT, Note } from "@/app/data/notes";
import { buildAllChordsLayout, buildKeyChordsLayout } from "./chordGridLayout";

const mode = (name: string, intervals: number[]): ChordMode => ({
  description: name,
  intervals,
  name,
  triad: name,
  extensions: [],
  canSkipPerfectFifth: false,
});

const MAJOR = mode("", [0, 4, 7]);
const MINOR = mode("m", [0, 3, 7]);
const DIM = mode("dim", [0, 3, 6]);

// E natural minor: E F# G A B C D
const E_MINOR = new Set([4, 6, 7, 9, 11, 0, 2]);

// a chord is playable when the scale holds each of its notes
const columnFor = (chordMode: ChordMode): ChordModeVariations => ({
  chordMode,
  variationsByNote: Array.from({ length: NOTE_COUNT }, (_, root) =>
    chordMode.intervals.every((i) => E_MINOR.has((root + i) % NOTE_COUNT))
      ? [{ variation: [], fingerAssignment: [], hasBarreOnIndexFinger: false }]
      : [],
  ),
});

const columns = [MAJOR, MINOR, DIM].map(columnFor);

describe("buildKeyChordsLayout", () => {
  it("lists the chords of the key from the root", () => {
    const cells = buildKeyChordsLayout(columns, Note.E, 4);
    expect(cells.map((c) => c.chordName)).toEqual([
      "Em",
      "F#dim",
      "G",
      "Am",
      "Bm",
      "C",
      "D",
    ]);
  });

  it("fills a column before starting the next", () => {
    const cells = buildKeyChordsLayout(columns, Note.E, 4);
    expect(cells.map((c) => [c.column, c.row])).toEqual([
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 0],
      [1, 1],
      [1, 2],
    ]);
  });
});

describe("buildAllChordsLayout", () => {
  it("greys out the chords outside the scale", () => {
    const cells = buildAllChordsLayout(columns, [Note.E]);
    expect(cells.map((c) => [c.chordName, c.isDisabled])).toEqual([
      ["E", true],
      ["Em", false],
      ["Edim", true],
    ]);
  });
});
