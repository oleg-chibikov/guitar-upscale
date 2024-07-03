import { chordModeOrder, getModeSuffix } from "@/app/data/chordModes";

export const sortChords = (chords: string[]): string[] =>
  chords.sort((a, b) => {
    // Check if either chord ends with "/Note"
    const aHasSlashNote = hasSlashNote(a);
    const bHasSlashNote = hasSlashNote(b);

    if (aHasSlashNote && !bHasSlashNote) {
      return 1; // a is preferred
    } else if (!aHasSlashNote && bHasSlashNote) {
      return -1; // b is preferred
    }

    // Compare by the mode suffix order
    const aSuffix = getModeSuffix(a);
    const bSuffix = getModeSuffix(b);
    const aIndex = chordModeOrder.indexOf(aSuffix);
    const bIndex = chordModeOrder.indexOf(bSuffix);
    if (aIndex !== bIndex) {
      return aIndex - bIndex;
    }

    // If lengths and mode suffixes are the same, sort alphabetically
    return a.localeCompare(b);
  });

const hasSlashNote = (chord: string): boolean => {
  return (
    chord.length >= 2 &&
    (chord[chord.length - 2] === "/" || chord[chord.length - 3] === "/")
  );
};
