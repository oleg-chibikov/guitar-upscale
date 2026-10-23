import {
  advancedChordModes,
  chordModes,
  getChordName,
} from "@/app/data/chordModes";
import { NOTE_COUNT, OctaveNote } from "@/app/data/notes";

// Names the chord whose notes are exactly these, with the bass note as the root when it can
export const matchChordMode = (sortedNotes: OctaveNote[]) => {
  const pitchClasses = new Set(sortedNotes.map((note) => note.note));
  const bass = sortedNotes.at(-1)?.note;
  if (bass === undefined || pitchClasses.size < 2) {
    return undefined;
  }
  const roots = [bass, ...Array.from(pitchClasses).filter((x) => x !== bass)];
  const modes = [...chordModes, ...advancedChordModes];
  for (const root of roots) {
    for (const mode of modes) {
      const tones = new Set(
        mode.intervals.map((interval) => (root + interval) % NOTE_COUNT)
      );
      const fifth = (root + 7) % NOTE_COUNT;
      const skipsFifth =
        mode.canSkipPerfectFifth &&
        tones.has(fifth) &&
        !pitchClasses.has(fifth);
      if (skipsFifth) {
        tones.delete(fifth);
      }
      const same =
        tones.size === pitchClasses.size &&
        Array.from(pitchClasses).every((note) => tones.has(note));
      if (same) {
        return getChordName(root, mode);
      }
    }
  }
  return undefined;
};
