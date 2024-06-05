import { chordModeOrder, getModeSuffix } from "@/app/data/chordModes";

export const sortChords = (chords: string[]): string[] =>
  chords.sort((a, b) => {
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
