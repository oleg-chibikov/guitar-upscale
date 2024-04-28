import { Chord, StringOctaveNote } from "../data/notes";
import { Trie } from "../helpers/trie";

type NoteWithClearCallback = {
  stringOctaveNote: StringOctaveNote;
  clear: () => void;
};

let stringNotes: (NoteWithClearCallback | null)[] = [];
let trie: Trie;
let reverseChordsMap: Map<string, string>;

let notesLength = 0;

export const createChordDetectorLookup = () => {
  trie = new Trie();
  reverseChordsMap = new Map<string, string>();
};

type MissingChar = "x" | "?";

const serializeChord = (chord: Chord, missingChar: MissingChar) => {
  const serializedChord: (number | MissingChar)[] = [];

  // Initialize the serializedChord with '?' for each position
  for (let i = 0; i < 6; i++) {
    serializedChord.push(missingChar);
  }

  // Populate serializedChord with note values where string is set
  chord.forEach((stringOctaveNote) => {
    serializedChord[stringOctaveNote.string] = stringOctaveNote.fret;
  });

  // Convert note values to string and return the serialized chord
  return serializedChord
    .map((item) => (typeof item === "number" ? item.toString() : item))
    .join("");
};

export const addChordToLookup = (chord: Chord, fullKey: string) => {
  const serializedChord = serializeChord(chord, "x");
  trie.add(serializedChord);
  reverseChordsMap.set(serializedChord, fullKey);
};

export const addNoteToDetector = (
  note: NoteWithClearCallback,
  showChord: (name: string) => void
) => {
  // index in this array corresponds to the string of the note
  const index = note.stringOctaveNote.string;
  const existing = stringNotes[index];
  // only one note per string allowed
  existing?.clear();

  // clicked on the marked note
  if (existing?.stringOctaveNote.fret === note.stringOctaveNote.fret) {
    stringNotes[index] = null;
    notesLength--;
  } else {
    stringNotes[index] = note;
    notesLength++;
  }
  if (notesLength > 2) {
    const findMatches = () => {
      //TODO Throttle - only play last in 100 ms. Try playing chord and play it once more - it clears but displays the weird chords
      const serializedChord = serializeChord(
        stringNotes
          .filter((x) => x)
          .map((x) => (x as NoteWithClearCallback).stringOctaveNote),
        "?" // wildcard - any char
      );
      const matchedValues = trie.wildcardMatches(serializedChord);
      const chordNames = Array.from(matchedValues).map((x) =>
        reverseChordsMap.get(x)
      );
      showChord(chordNames.join(", "));
    };
    findMatches();
  }
};

export const clearDetector = () => {
  stringNotes.forEach((note) => note?.clear());
  stringNotes = [];
  notesLength = 0;
};
