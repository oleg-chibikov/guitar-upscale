import { scalesMap } from "@/app/data/scaleDefinitions";
import { pickSongScale, toNoteMask } from "@/app/engine/songs/songScale";

describe("pickSongScale", () => {
  it("picks the smallest scale that holds every note", () => {
    expect(pickSongScale(toNoteMask([0, 3, 5, 7, 10]), scalesMap)).toEqual({
      scaleGroup: "Minor",
      scale: "Pentatonic Minor",
    });
  });

  it("gives a tie to the scale listed first", () => {
    expect(pickSongScale(toNoteMask([0, 2, 3, 5, 7, 10]), scalesMap)).toEqual({
      scaleGroup: "Minor",
      scale: "Aeolian / Natural",
    });
  });

  it("skips a scale that misses one note of the song", () => {
    expect(
      pickSongScale(toNoteMask([0, 2, 3, 5, 7, 8, 10, 11]), scalesMap)
    ).toEqual({ scaleGroup: "Minor", scale: "Harmonic Bebop + #4" });
  });

  it("falls back to every note when no other scale fits", () => {
    expect(
      pickSongScale(toNoteMask([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]), scalesMap)
    ).toEqual({ scaleGroup: "Special", scale: "Chromatic (All notes)" });
  });
});
