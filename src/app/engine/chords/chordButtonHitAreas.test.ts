import { findClosestCell } from "./chordButtonHitAreas";

const viewport = { left: 0, top: 0, right: 200, bottom: 100 };
const cell = (left: number, top: number, value: string) => ({
  rect: { left, top, right: left + 64, bottom: top + 24 },
  value,
});
const cells = [cell(0, 0, "C"), cell(66, 0, "Cm"), cell(300, 0, "Cdim")];

describe("findClosestCell", () => {
  it("returns the cell under the point", () => {
    expect(findClosestCell(cells, 70, 10, viewport)).toBe("Cm");
  });

  it("snaps to the closest cell nearby", () => {
    expect(findClosestCell(cells, 60, 40, viewport)).toBe("C");
  });

  it("ignores presses far from every cell", () => {
    expect(findClosestCell(cells, 100, 90, viewport)).toBeUndefined();
  });

  it("skips cells scrolled out of view", () => {
    expect(findClosestCell(cells, 310, 10, viewport)).toBeUndefined();
  });
});
