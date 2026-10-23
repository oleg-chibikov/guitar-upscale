import { scalesMap } from "@/app/data/scaleDefinitions";
import { sortScales } from "@/app/engine/scales/scaleSorter";

const getScale = (group: string, scale: string) =>
  scalesMap.get(group)?.get(scale);

describe("scalesMap", () => {
  it("counts every note from the root, going up inside one octave", () => {
    for (const [group, scales] of Array.from(scalesMap.entries())) {
      for (const [name, notes] of Array.from(scales.entries())) {
        const sorted = Array.from(new Set(notes)).sort((a, b) => a - b);
        expect({ group, name, notes }).toEqual({ group, name, notes: sorted });
        expect(notes.every((note) => note >= 1 && note <= 11)).toBe(true);
      }
    }
  });

  it.each([
    ["Minor", "Aeolian / Natural", [2, 3, 5, 7, 8, 10]],
    ["Minor", "Harmonic", [2, 3, 5, 7, 8, 11]],
    ["Minor", "Melodic", [2, 3, 5, 7, 9, 11]],
    ["Major", "Ionian", [2, 4, 5, 7, 9, 11]],
    ["Major", "Harmonic", [2, 4, 5, 7, 8, 11]],
    ["Special", "Altered", [1, 3, 4, 6, 8, 10]],
    ["Special", "Augmented", [3, 4, 7, 8, 11]],
    ["Special", "UltraLocrian", [1, 3, 4, 6, 8, 9]],
  ])("holds the textbook notes of %s %s", (group, scale, notes) => {
    expect(getScale(group, scale)).toEqual(notes);
  });
});

describe("sortScales", () => {
  it("keeps the list order inside a group", () => {
    const sorted = sortScales([
      { group: "Minor", scale: "Dorian", note: 0 },
      { group: "Major", scale: "Ionian", note: 0 },
      { group: "Minor", scale: "Aeolian / Natural", note: 2 },
      { group: "Minor", scale: "Aeolian / Natural", note: 0 },
    ]);
    expect(
      sorted.map(({ group, scale, note }) => `${group} ${scale} ${note}`),
    ).toEqual([
      "Minor Aeolian / Natural 0",
      "Minor Aeolian / Natural 2",
      "Minor Dorian 0",
      "Major Ionian 0",
    ]);
  });
});
