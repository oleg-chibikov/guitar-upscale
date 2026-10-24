import {
  ChordBuilderInfo,
  ChordModeVariations,
  getChordName,
} from "@/app/data/chordModes";
import { ChordPlayMode } from "@/app/data/chordPlayMode";
import { NOTE_COUNT } from "@/app/data/notes";
import { getPreferredChordVariation } from "@/app/engine/chords/chordVariationHelper";
import { stringCountValue } from "@/app/store/settingsSlice";

export const chordPreferredVariationsByName = new Map<
  string,
  ChordBuilderInfo
>();

export function setPreferredVariationsForChordMode(
  chordModeVariations: ChordModeVariations,
  type: ChordPlayMode,
) {
  const chordMode = chordModeVariations.chordMode;
  for (let note = 0; note < NOTE_COUNT; note++) {
    const variationsForNote = chordModeVariations.variationsByNote[note];
    if (!variationsForNote || !variationsForNote.length) {
      continue;
    }
    const preferredVariationsForNote = getPreferredChordVariation(
      variationsForNote,
      chordMode.name === "5" ? "low" : "high", // Power chords prefer lower strings
      stringCountValue,
      type,
    );
    const chordName = getChordName(note, chordMode);
    if (preferredVariationsForNote) {
      chordPreferredVariationsByName.set(chordName, preferredVariationsForNote);
    }
  }
}
