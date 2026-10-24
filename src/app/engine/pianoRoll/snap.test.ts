import { Note } from "@/app/data/notes";
import { floorTick, snapPitchToScale, snapTick } from "./snap";

const cMajor = new Set([
  Note.C,
  Note.D,
  Note.E,
  Note.F,
  Note.G,
  Note.A,
  Note.B,
]);

describe("snapTick", () => {
  it("rounds to the nearest step", () => {
    expect(snapTick(11, 8)).toBe(8);
    expect(snapTick(12, 8)).toBe(16);
    expect(snapTick(13, 8)).toBe(16);
  });

  it("stops at tick 0", () => {
    expect(snapTick(-3, 8)).toBe(0);
  });
});

describe("floorTick", () => {
  it("rounds down to the step", () => {
    expect(floorTick(15, 8)).toBe(8);
    expect(floorTick(16, 8)).toBe(16);
  });

  it("stops at tick 0", () => {
    expect(floorTick(-1, 8)).toBe(0);
  });
});

describe("snapPitchToScale", () => {
  it("keeps a pitch that is in the scale", () => {
    expect(snapPitchToScale(48, cMajor)).toBe(48);
  });

  it("gives a tie to the higher pitch", () => {
    // C#4 sits between C4 and D4
    expect(snapPitchToScale(49, cMajor)).toBe(50);
  });

  it("keeps the pitch when the scale is empty", () => {
    expect(snapPitchToScale(49, new Set())).toBe(49);
  });

  it("looks down when the pitch above is off the roll", () => {
    // B8 is the top pitch, so the C above it is out of reach
    expect(snapPitchToScale(107, new Set([Note.C]))).toBe(96);
  });
});
