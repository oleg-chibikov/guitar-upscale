import { Note } from "@/app/data/notes";

export const parseChordNoteAndAlterations = (chord: string) => {
  let chordNote = chord[0];
  let alterations = chord.substring(1);

  // If the second character is '#', include it in the chord note
  if (chord.length > 1 && chord[1] === "#") {
    chordNote += "#";
    alterations = chord.substring(2);
  }

  // Convert the chord note string to Note enum value
  const chordBaseNote = Note[chordNote as keyof typeof Note];
  return { chordBaseNote, alterations };
};
