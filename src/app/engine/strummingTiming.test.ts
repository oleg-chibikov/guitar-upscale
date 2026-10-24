import { TimeSignature } from "@/app/data/clockConstants";
import { StrumDirection } from "@/app/data/strummingPatterns";
import { getIntervalsToSkip } from "@/app/engine/strummingTiming";

jest.mock("@/app/helpers/debugLog", () => ({ debugLog: () => {} }));

const pattern = (timeSignature: TimeSignature, strumCount: number) => ({
  timeSignature,
  strums: new Array<StrumDirection>(strumCount).fill("↓"),
});

describe("getIntervalsToSkip", () => {
  it("lines a bar long pattern up with the next bar", () => {
    // 8 eighths fill a bar. From tick 20 the next bar is 44 ticks away, room for 5 strums.
    expect(getIntervalsToSkip(pattern(TimeSignature.HALF_BEAT, 8), 20)).toBe(3);
  });

  it("skips the whole pattern when the press lands on a bar", () => {
    expect(getIntervalsToSkip(pattern(TimeSignature.HALF_BEAT, 8), 64)).toBe(8);
  });

  it("lines a half bar pattern up with the next half bar", () => {
    // 4 eighths fill a half bar. From tick 50 the next half bar is 14 ticks away, room for 1 strum.
    expect(getIntervalsToSkip(pattern(TimeSignature.HALF_BEAT, 4), 50)).toBe(3);
  });

  it("lines a beat long pattern up with the next beat", () => {
    // 2 eighths fill a beat. From tick 26 the next beat is 6 ticks away, too close for a strum.
    expect(getIntervalsToSkip(pattern(TimeSignature.HALF_BEAT, 2), 26)).toBe(2);
    expect(getIntervalsToSkip(pattern(TimeSignature.HALF_BEAT, 2), 20)).toBe(1);
  });

  it("lines a pattern shorter than a beat up with the next half beat", () => {
    // 3 sixty-fourths take 3 ticks. From tick 7 the next half beat is 1 tick away.
    expect(getIntervalsToSkip(pattern(TimeSignature.SIXTY_FOURTH, 3), 7)).toBe(
      2,
    );
    expect(getIntervalsToSkip(pattern(TimeSignature.SIXTY_FOURTH, 3), 6)).toBe(
      1,
    );
  });

  it("skips at least 1 strum", () => {
    expect(getIntervalsToSkip(pattern(TimeSignature.HALF_BEAT, 0), 3)).toBe(1);
  });
});
