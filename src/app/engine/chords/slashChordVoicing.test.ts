import {
  ChordBuilderInfo,
  StringOctaveNoteWithFingerPosition,
} from "@/app/data/chordModes";
import { ChordPlayMode } from "@/app/data/chordPlayMode";
import { getPreferredChordVariation } from "@/app/engine/chords/chordVariationHelper";
import { FretChordsGenerator } from "@/app/engine/chords/generatorWorker/fretChordsGenerator";
import { SharedArrayCache } from "@/app/engine/chords/generatorWorker/sharedArrayCache";
import { getSlashChordVoicing } from "@/app/engine/chords/slashChordVoicing";
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

const preferred = (root: number, intervals: number[], mode: ChordPlayMode) => {
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
  const { variation, fingerAssignment } = getPreferredChordVariation(
    voicings,
    "high",
    6,
    mode,
  );
  return variation
    .map((stringOctaveNote, i) =>
      stringOctaveNote === undefined
        ? undefined
        : { stringOctaveNote, fingerIndex: fingerAssignment[i] },
    )
    .filter((x): x is StringOctaveNoteWithFingerPosition => x !== undefined);
};

const toTab = (notes: StringOctaveNoteWithFingerPosition[]) =>
  [5, 4, 3, 2, 1, 0]
    .map(
      (string) =>
        notes.find((x) => x.stringOctaveNote.string === string)
          ?.stringOctaveNote.fret ?? "x",
    )
    .join("");

const getPitch = ({
  stringOctaveNote: { octave, note },
}: StringOctaveNoteWithFingerPosition) => octave * 12 + note;

const CHORDS: [string, number[]][] = [
  ["major", [0, 4, 7]],
  ["minor", [0, 3, 7]],
  ["dominant 7th", [0, 4, 7, 10]],
];

describe("slash chord voicing", () => {
  it("moves a chord note into the bass", () => {
    const c = preferred(0, [0, 4, 7], ChordPlayMode.Preferred_Variation);
    expect(toTab(getSlashChordVoicing(c, 4, neck, 0)!)).toBe("032010");
  });

  it("drops the notes under a bass that can't go lower", () => {
    const f = preferred(5, [0, 4, 7], ChordPlayMode.Barre);
    expect(toTab(f)).toBe("133211");
    expect(toTab(getSlashChordVoicing(f, 2, neck, 0)!)).toBe("x53211");
  });

  it("leaves the chord as is when the bass is already there", () => {
    const c = preferred(0, [0, 4, 7], ChordPlayMode.Preferred_Variation);
    expect(getSlashChordVoicing(c, 0, neck, 0)).toBeUndefined();
  });

  it.each(CHORDS)("finds every bass note for %s chords", (_, intervals) => {
    for (const mode of [
      ChordPlayMode.Preferred_Variation,
      ChordPlayMode.Barre,
    ]) {
      for (let root = 0; root < 12; root++) {
        const notes = preferred(root, intervals, mode);
        for (let bass = 0; bass < 12; bass++) {
          if (bass === notes[notes.length - 1].stringOctaveNote.note) {
            continue;
          }
          const voicing = getSlashChordVoicing(notes, bass, neck, 0)!;
          const bassNote = voicing[voicing.length - 1];
          expect(bassNote.stringOctaveNote.note).toBe(bass);
          expect(Math.min(...voicing.map(getPitch))).toBe(getPitch(bassNote));
        }
      }
    }
  });
});
