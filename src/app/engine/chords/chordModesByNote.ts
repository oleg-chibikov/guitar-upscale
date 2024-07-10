import { ChordMode, ChordModeVariationsContainer } from "@/app/data/chordModes";
import { Note, NOTE_COUNT } from "@/app/data/notes";

type ChordModesForNote = Set<ChordMode> | undefined;
type ChordsModesByNote = ChordModesForNote[];
const chordModesByNote: ChordsModesByNote = [];

export const getModesForNote = (note: Note): ChordModesForNote =>
  chordModesByNote[note];

export function setChordModeForNotes(
  chordModeVariationsContainer: ChordModeVariationsContainer
) {
  for (let note = 0; note < NOTE_COUNT; note++) {
    const variationsForNote =
      chordModeVariationsContainer.chordModeVariations.variationsByNote[note];
    if (!variationsForNote || variationsForNote.length === 0) {
      continue;
    }
    const modesSetForNote = chordModesByNote[note] ?? new Set<ChordMode>();
    modesSetForNote.add(
      chordModeVariationsContainer.chordModeVariations.chordMode
    );
    chordModesByNote[note] = modesSetForNote;
  }
}

export const resetChordModesForNotes = () => {
  chordModesByNote.length = 0;
};
