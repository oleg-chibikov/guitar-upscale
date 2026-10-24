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
const MAJ7 = mode("maj7", [0, 4, 7, 11]);
const M7 = mode("m7", [0, 3, 7, 10]);

// E natural minor: E F# G A B C D
const E_MINOR = new Set([4, 6, 7, 9, 11, 0, 2]);

// a chord is playable when the scale holds each of its notes
const columnFor = (
  chordMode: ChordMode,
  scale: Set<number> = E_MINOR,
): ChordModeVariations => ({
  chordMode,
  variationsByNote: Array.from({ length: NOTE_COUNT }, (_, root) =>
    chordMode.intervals.every((i) => scale.has((root + i) % NOTE_COUNT))
      ? [{ variation: [], fingerAssignment: [], hasBarreOnIndexFinger: false }]
      : [],
  ),
});

const columns = [MAJOR, MINOR, DIM].map((m) => columnFor(m));
const columnsWithSevenths = [MAJOR, MINOR, DIM, MAJ7, M7].map((m) =>
  columnFor(m),
);

describe("buildKeyChordsLayout", () => {
  it("lists the chords of the key from the root", () => {
    const cells = buildKeyChordsLayout(columns, Note.E);
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

  it("fills a row before starting the next, in a square grid", () => {
    const cells = buildKeyChordsLayout(columns, Note.E);
    expect(cells.map((c) => [c.column, c.row])).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
      [2, 1],
      [0, 2],
    ]);
  });
});

describe("buildKeyChordsLayout with seventh chords", () => {
  it("fills the empty cells with a seventh chord on the root and the fifth", () => {
    const cells = buildKeyChordsLayout(columnsWithSevenths, Note.E);
    expect(cells.map((c) => c.chordName)).toEqual([
      "Em",
      "F#dim",
      "G",
      "Am",
      "Bm",
      "C",
      "D",
      "Em7",
      "Bm7",
    ]);
  });

  it("adds nothing when the grid is full", () => {
    // E minor without C gives Em G Bm D, a full 2 by 2 grid
    const scale = new Set([4, 6, 7, 9, 11, 2]);
    const cells = buildKeyChordsLayout(
      [MAJOR, MINOR, DIM, MAJ7, M7].map((m) => columnFor(m, scale)),
      Note.E,
    );
    expect(cells.map((c) => c.chordName)).toEqual(["Em", "G", "Bm", "D"]);
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
