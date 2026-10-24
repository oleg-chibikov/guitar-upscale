import {
  clampPitch,
  fromPitch,
  getContentHeight,
  getTotalTicks,
  pitchToY,
  tickToX,
  toPitch,
  xToTick,
  yToPitch,
} from "./geometry";

const zoom = { pixelsPerTick: 2, noteHeight: 20 };
const TOP_PITCH = 107;

describe("piano roll geometry", () => {
  it("turns an octave note into a pitch and back", () => {
    expect(toPitch({ octave: 4, note: 9 })).toBe(57);
    expect(fromPitch(57)).toEqual({ octave: 4, note: 9 });
  });

  it("keeps the note in range below pitch 0", () => {
    expect(fromPitch(-1)).toEqual({ octave: -1, note: 11 });
  });

  it("clamps a pitch to the roll", () => {
    expect(clampPitch(-5)).toBe(0);
    expect(clampPitch(200)).toBe(TOP_PITCH);
    expect(clampPitch(60)).toBe(60);
  });

  it("draws the highest pitch at the top", () => {
    expect(pitchToY(TOP_PITCH, zoom)).toBe(0);
    expect(pitchToY(0, zoom)).toBe(TOP_PITCH * 20);
  });

  it("reads the pitch under a y position", () => {
    expect(yToPitch(0, zoom)).toBe(TOP_PITCH);
    expect(yToPitch(19, zoom)).toBe(TOP_PITCH);
    expect(yToPitch(20, zoom)).toBe(TOP_PITCH - 1);
    expect(yToPitch(100_000, zoom)).toBe(0);
  });

  it("maps ticks to x and back", () => {
    expect(tickToX(10, zoom)).toBe(20);
    expect(xToTick(20, zoom)).toBe(10);
    expect(xToTick(-5, zoom)).toBe(0);
  });

  it("fits every pitch in the content height", () => {
    expect(getContentHeight(zoom)).toBe((TOP_PITCH + 1) * 20);
  });

  it("shows at least 25 bars", () => {
    expect(getTotalTicks(0)).toBe(25 * 64);
  });

  it("leaves 8 bars after the last note", () => {
    expect(getTotalTicks(20 * 64)).toBe(28 * 64);
    expect(getTotalTicks(20 * 64 + 1)).toBe(29 * 64);
  });
});
