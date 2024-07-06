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
    // chords coming to this function (they come from trie) are already sorted properly. We just need to put slash chords after non slash chords
    return 0;
  });

const hasSlashNote = (chord: string): boolean => {
  return (
    chord.length >= 2 &&
    (chord[chord.length - 2] === "/" || chord[chord.length - 3] === "/")
  );
};
