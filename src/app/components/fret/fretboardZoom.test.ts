import {
  getDominantAxis,
  getPinchFactor,
  hasPinchStarted,
  zoomFretboard,
} from "./fretboardZoom";

describe("getPinchFactor", () => {
  it("gives the ratio of the finger spread on each axis", () => {
    expect(getPinchFactor({ x: 100, y: 50 }, { x: 200, y: 25 })).toEqual({
      x: 2,
      y: 0.5,
    });
  });

  it("keeps an axis where the fingers started too close", () => {
    expect(getPinchFactor({ x: 100, y: 5 }, { x: 150, y: 80 }).y).toBe(1);
  });
});

describe("hasPinchStarted", () => {
  it("waits while two fingers hold a chord", () => {
    expect(hasPinchStarted({ x: 100, y: 40 }, { x: 110, y: 45 })).toBe(false);
  });

  it("starts once the spread changes enough", () => {
    expect(hasPinchStarted({ x: 100, y: 40 }, { x: 140, y: 40 })).toBe(true);
  });
});

describe("zoomFretboard", () => {
  it("draws the board larger when the fingers spread", () => {
    const scale = zoomFretboard({ x: 2, y: 0.9 }, { x: 2, y: 1 });
    expect(scale.x).toBe(1);
    expect(scale.y).toBe(0.9);
  });

  it("stays inside the slider range", () => {
    expect(zoomFretboard({ x: 2, y: 0.8 }, { x: 0.1, y: 10 })).toEqual({
      x: 3,
      y: 0.7,
    });
  });
});

describe("getDominantAxis", () => {
  it("picks the axis that moved more, pinching in or out", () => {
    expect(getDominantAxis({ x: 1.2, y: 0.5 })).toBe("y");
    expect(getDominantAxis({ x: 3, y: 0.5 })).toBe("x");
  });
});
