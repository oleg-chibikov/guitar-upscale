import { THUMB } from "@/app/data/chordFingerConstants";
import { ChordBuilderInfo } from "@/app/data/chordModes";
import { ChordPlayMode } from "@/app/data/chordPlayMode";
import { getPreferredChordVariation } from "@/app/engine/chords/chordVariationHelper";
import { FretChordsGenerator } from "@/app/engine/chords/generatorWorker/fretChordsGenerator";
import { SharedArrayCache } from "@/app/engine/chords/generatorWorker/sharedArrayCache";
import { generateNeckRepresentation } from "@/app/engine/generateNeckRepresentation";

const STANDARD_TUNING = [
  { note: 4, octave: 4 },
  { note: 11, octave: 3 },
  { note: 7, octave: 3 },
  { note: 2, octave: 3 },
  { note: 9, octave: 2 },
  { note: 4, octave: 2 },
];
const ALL_NOTES = new Set(Array.from({ length: 12 }, (_, note) => note));
const neck = generateNeckRepresentation(ALL_NOTES, STANDARD_TUNING, 0, 0);

const generateVoicings = (root: number, intervals: number[]) => {
  const cache = new SharedArrayCache();
  const voicings: ChordBuilderInfo[] = [];
  for (let string = 5; string >= intervals.length - 1; string--) {
    for (let fret = 0; fret < 12; fret++) {
      const note = neck[string][fret]!;
      if (note.note === root) {
        voicings.push(
          ...new FretChordsGenerator(0, neck, 12, cache).processFret(
            intervals,
            note,
          ),
        );
      }
    }
  }
  return voicings;
};

// Low string first, e.g. "x32010 -32-1-". T is the thumb.
const toTab = ({ variation, fingerAssignment }: ChordBuilderInfo) => {
  const strings = [5, 4, 3, 2, 1, 0];
  const frets = strings
    .map((string) => variation[string]?.fret ?? "x")
    .join("");
  const fingers = strings
    .map((string) => {
      const finger = fingerAssignment[string];
      const fret = variation[string]?.fret;
      if (fret === undefined || fret === 0 || finger === undefined) {
        return "-";
      }
      return finger === THUMB ? "T" : String(finger + 1);
    })
    .join("");
  return `${frets} ${fingers}`;
};

describe("chord voicings", () => {
  it("builds the common open and barre shapes", () => {
    const tabs = (root: number, intervals: number[]) =>
      generateVoicings(root, intervals).map(toTab);

    expect(tabs(0, [0, 4, 7])).toContain("x32010 -32-1-");
    expect(tabs(5, [0, 4, 7])).toContain("133211 134211");
    expect(tabs(9, [0, 3, 7])).toContain("x02210 --231-");
    expect(tabs(11, [0, 3, 7])).toContain("x24432 -13421");
    expect(tabs(2, [0, 4, 7, 10])).toContain("xx0212 ---213");
  });

  it("keeps the fingers within a hand span", () => {
    for (let root = 0; root < 12; root++) {
      for (const voicing of generateVoicings(root, [0, 4, 7, 10])) {
        const fingerFrets = voicing.variation
          .filter((_, string) => voicing.fingerAssignment[string] !== THUMB)
          .map((note) => note?.fret ?? 0)
          .filter((fret) => fret > 0);
        const lowestFret = Math.min(...fingerFrets);
        const span = Math.max(...fingerFrets) - lowestFret;
        expect(span).toBeLessThanOrEqual(lowestFret >= 8 ? 5 : 4);
      }
    }
  });

  it("puts the thumb at or behind the other fingers", () => {
    expect(generateVoicings(5, [0, 4, 7]).map(toTab)).toContain(
      "1x3211 T-3211",
    );

    for (let root = 0; root < 12; root++) {
      for (const voicing of generateVoicings(root, [0, 4, 7])) {
        if (voicing.fingerAssignment[5] !== THUMB) {
          continue;
        }
        const thumbFret = voicing.variation[5]!.fret;
        const fingerFrets = voicing.variation
          .slice(0, 5)
          .map((note) => note?.fret ?? 0)
          .filter((fret) => fret > 0);
        expect(Math.min(...fingerFrets)).toBeGreaterThanOrEqual(thumbFret);
      }
    }
  });

  it("lays a barre only over fretted strings", () => {
    const chordTypes = [
      [0, 4, 7],
      [0, 3, 7],
      [0, 3, 6],
      [0, 5, 7],
      [0, 4, 7, 10],
      [0, 3, 7, 10],
      [0, 4, 7, 11],
    ];
    const barresOverEmptyStrings: string[] = [];
    for (const intervals of chordTypes) {
      for (let root = 0; root < 12; root++) {
        for (const voicing of generateVoicings(root, intervals)) {
          const { variation, fingerAssignment } = voicing;
          for (let finger = 0; finger < 4; finger++) {
            const strings = fingerAssignment
              .map((f, string) =>
                f === finger && (variation[string]?.fret ?? 0) > 0
                  ? string
                  : undefined,
              )
              .filter((string) => string !== undefined);
            for (
              let string = Math.min(...strings);
              string < Math.max(...strings);
              string++
            ) {
              // the barre would press this muted or open string too
              if ((variation[string]?.fret ?? 0) === 0) {
                barresOverEmptyStrings.push(toTab(voicing));
              }
            }
          }
        }
      }
    }
    expect(barresOverEmptyStrings).toEqual([]);
  });
});

describe("preferred variation", () => {
  const pick = (root: number, intervals: number[], mode: ChordPlayMode) =>
    toTab(
      getPreferredChordVariation(
        generateVoicings(root, intervals),
        "high",
        6,
        mode,
      )!,
    );

  it("picks the usual fingering for open chords", () => {
    expect(pick(7, [0, 4, 7], ChordPlayMode.Preferred_Variation)).toBe(
      "320003 21---3",
    );
    expect(pick(2, [0, 4, 7], ChordPlayMode.Preferred_Variation)).toBe(
      "xx0232 ---132",
    );
    expect(pick(2, [0, 4, 7, 10], ChordPlayMode.Preferred_Variation)).toBe(
      "xx0212 ---213",
    );
  });

  it("picks the nearest E or A shape for barre chords", () => {
    expect(pick(2, [0, 4, 7], ChordPlayMode.Barre)).toBe("x57775 -12341");
    expect(pick(9, [0, 3, 7], ChordPlayMode.Barre)).toBe("577555 134111");
  });
});
