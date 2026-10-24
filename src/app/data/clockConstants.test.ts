import { TimeSignature, getTicksForTimeSignature } from "./clockConstants";

describe("getTicksForTimeSignature", () => {
  it.each([
    [TimeSignature.ONE_BAR, 64],
    [TimeSignature.HALF_BAR, 32],
    [TimeSignature.ONE_BEAT, 16],
    [TimeSignature.HALF_BEAT, 8],
    [TimeSignature.SIXTEENTH, 4],
    [TimeSignature.THIRTY_SECOND, 2],
    [TimeSignature.SIXTY_FOURTH, 1],
  ])("gives %s %d ticks", (timeSignature, ticks) => {
    expect(getTicksForTimeSignature(timeSignature)).toBe(ticks);
  });

  it("throws on an unknown time signature", () => {
    expect(() => getTicksForTimeSignature("1/3" as TimeSignature)).toThrow(
      "Invalid time signature: 1/3",
    );
  });
});
