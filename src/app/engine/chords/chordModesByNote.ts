import { ChordMode, ChordModeVariations } from "@/app/data/chordModes";
import { Note, NOTE_COUNT } from "@/app/data/notes";

type ChordModesForNote = Set<ChordMode> | undefined;
type ChordsModesByNote = ChordModesForNote[];
const chordModesByNote: ChordsModesByNote = [];
let version = 0;

// bumps on every change, so a canvas can tell when to redraw
export const getChordModesVersion = () => version;

export const getModesForNote = (note: Note): ChordModesForNote =>
  chordModesByNote[note];

export function setChordModeForNotes(chordModeVariations: ChordModeVariations) {
  for (let note = 0; note < NOTE_COUNT; note++) {
    const variationsForNote = chordModeVariations.variationsByNote[note];
    if (!variationsForNote || variationsForNote.length === 0) {
      continue;
    }
    const modesSetForNote = chordModesByNote[note] ?? new Set<ChordMode>();
    modesSetForNote.add(chordModeVariations.chordMode);
    chordModesByNote[note] = modesSetForNote;
  }
  version++;
}

export const resetChordModesForNotes = () => {
  chordModesByNote.length = 0;
  version++;
};
