import { shiftOctaveNote, transposeChordName } from "./songDecoder";

jest.mock("@/app/engine/eventIdGenerator", () => ({
  IdGenerator: { generate: (prefix = "") => prefix },
}));
jest.mock("@/app/engine/midiParser/chordMatcher", () => ({}));
jest.mock("@/app/engine/midiParser/individualNoteMapper", () => ({}));
jest.mock("@/app/engine/songs/chordNameMatcher", () => ({}));
jest.mock("@/app/store/settingsSlice", () => ({
  capoValue: 0,
  neckValue: null,
  tuningValue: "Standard",
}));

describe("shiftOctaveNote", () => {
  it("moves a note up inside the octave", () => {
    expect(shiftOctaveNote({ octave: 3, note: 4 }, 3)).toEqual({
      octave: 3,
      note: 7,
    });
  });

  it("moves into the next octave", () => {
    expect(shiftOctaveNote({ octave: 3, note: 11 }, 2)).toEqual({
      octave: 4,
      note: 1,
    });
  });

  it("moves down into the octave below", () => {
    expect(shiftOctaveNote({ octave: 3, note: 1 }, -3)).toEqual({
      octave: 2,
      note: 10,
    });
  });
});

describe("transposeChordName", () => {
  it("moves the root and keeps the chord type", () => {
    expect(transposeChordName("Am7", 2)).toBe("Bm7");
  });

  it("wraps past B", () => {
    expect(transposeChordName("A#m", 3)).toBe("C#m");
    expect(transposeChordName("C", -1)).toBe("B");
  });

  it("keeps the name for a whole octave", () => {
    expect(transposeChordName("Em", 12)).toBe("Em");
  });

  it("keeps the bass note of a slash chord", () => {
    expect(transposeChordName("C/G", 2)).toBe("D/G");
  });

  it("keeps text that is no chord", () => {
    expect(transposeChordName("N.C.", 2)).toBe("N.C.");
  });
});
