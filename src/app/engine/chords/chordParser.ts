import { Note } from "@/app/data/notes";
import { Chord } from "tonal";

export const parseChordNoteAndAlterations = (chord: string) => {
  const [chordNote, type, bass] = Chord.tokenize(chord);
  const chordBaseNote = Note[chordNote as keyof typeof Note];
  const alterations = bass ? `${type}/${bass}` : type;
  return { chordBaseNote, alterations };
};
