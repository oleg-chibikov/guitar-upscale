import {
  HEADER_GAP,
  findFretHit,
  getFretboardLayout,
} from "./fretboardLayout";

const noTilt = { slope: 0, center: 0 };
const layout = getFretboardLayout(24, 6, 10, 24, noTilt);
const everyNote = () => true;

describe("getFretboardLayout", () => {
  it("puts the frets next to each other, each one narrower", () => {
    const [first, second] = layout.columns;
    expect(second.left).toBeCloseTo(first.left + first.width);
    expect(second.width).toBeLessThan(first.width);
  });

  it("places the first string below the fret numbers", () => {
    expect(layout.getStringCenterY(0, 0)).toBe(24 + HEADER_GAP + 12);
  });
});

describe("findFretHit", () => {
  const second = layout.columns[2];

  it("finds the fret number", () => {
    expect(
      findFretHit(layout, second.centerX, layout.headerCenterY, everyNote, 6)
    ).toEqual({ kind: "header", fret: 2 });
  });

  it("finds the string closest to the press", () => {
    const y = layout.getStringCenterY(3, 2) + 5;
    expect(findFretHit(layout, second.centerX, y, everyNote, 6)).toEqual({
      kind: "note",
      string: 3,
      fret: 2,
    });
  });

  it("skips frets with no note in the scale", () => {
    const y = layout.getStringCenterY(3, 2) + 10;
    const onlyString4 = (string: number) => string === 4;
    expect(findFretHit(layout, second.centerX, y, onlyString4, 6)).toEqual({
      kind: "note",
      string: 4,
      fret: 2,
    });
  });

  it("misses past the last fret", () => {
    expect(
      findFretHit(layout, layout.width + 1, layout.headerCenterY, everyNote, 6)
    ).toBeUndefined();
  });
});
