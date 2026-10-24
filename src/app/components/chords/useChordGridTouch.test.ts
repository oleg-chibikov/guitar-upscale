import { TWO_FINGER_WINDOW_MS, startsScroll } from "./useChordGridTouch";

describe("startsScroll", () => {
  it("plays when one finger lands alone", () => {
    expect(startsScroll(1000, [], 1)).toBe(false);
  });

  it("scrolls when two fingers land in the same event", () => {
    expect(startsScroll(1000, [], 2)).toBe(true);
  });

  it("scrolls when a second finger lands right after the first", () => {
    expect(startsScroll(1000, [1000 - TWO_FINGER_WINDOW_MS], 1)).toBe(true);
  });

  it("plays when the other finger has been holding a chord", () => {
    expect(startsScroll(1000, [1000 - TWO_FINGER_WINDOW_MS - 1], 1)).toBe(
      false,
    );
  });
});
