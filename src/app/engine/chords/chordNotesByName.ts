import {
  ChordModeVariationsContainer,
  getChordName,
} from "@/app/data/chordModes";
import { NOTE_COUNT } from "@/app/data/notes";
import { ChordPreferredVariations } from "@/app/engine/chords/chordVariationHelper";

export const chordNotesByName = new Map<string, ChordPreferredVariations>();

export function setPreferredVariationsForChordMode(
  chordModeVariationsContainer: ChordModeVariationsContainer
) {
  for (let note = 0; note < NOTE_COUNT; note++) {
    const preferredVariationsForNote =
      chordModeVariationsContainer.preferredVariationsByNote[note];
    if (!preferredVariationsForNote) {
      continue;
    }
    const chordName = getChordName(
      note,
      chordModeVariationsContainer.chordModeVariations.chordMode
    );
    chordNotesByName.set(chordName, preferredVariationsForNote);
  }
}
