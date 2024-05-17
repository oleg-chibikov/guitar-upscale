import { Chord, StringOctaveNote } from "@/app/data/notes";
import { trailingDebounce } from "@/app/helpers/debounce";
import { Trie } from "@/app/helpers/trie";

type NoteWithClearCallback = {
  stringOctaveNote: StringOctaveNote;
  clear: () => void;
};

let stringNotes: (NoteWithClearCallback | null)[] = [];
let trie: Trie;
let reverseChordsMap: Map<string, string>;

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

const findMatches = (showChord: (name: string) => void) => {
  console.log("Detecting chord");
  const usedNotes = stringNotes.filter((x) => x);
  if (usedNotes.length <= 2) {
    return;
  }
  const serializedChord = serializeChord(
    usedNotes.map((x) => (x as NoteWithClearCallback).stringOctaveNote),
    "?" // wildcard - any char
  );
  const matchedValues = trie.wildcardMatches(serializedChord);
  console.log("Matched values from trie", matchedValues);
  const chordNames = Array.from(matchedValues).map((x) =>
    reverseChordsMap.get(x)
  );
  console.log("Matched chord names", chordNames);
  showChord(chordNames.join(", "));
};

const debouncedFindMatches = trailingDebounce(findMatches, 200);

export const addChordToDetectorLookup = (chord: Chord, fullKey: string) => {
  const serializedChord = serializeChord(chord, "x");
  trie.add(serializedChord);
  reverseChordsMap.set(serializedChord, fullKey);
};

export const addNoteToDetector = (
  note: NoteWithClearCallback,
  showChord: (name: string) => void
) => {
  console.log("Adding note to chordDetector", note);
  // index in this array corresponds to the string of the note
  const index = note.stringOctaveNote.string;
  const existing = stringNotes[index];
  // only one note per string allowed
  existing?.clear();

  // clicked on the marked note
  if (existing?.stringOctaveNote.fret === note.stringOctaveNote.fret) {
    stringNotes[index] = null;
  } else {
    stringNotes[index] = note;
  }

  debouncedFindMatches(showChord);
};

export const clearDetector = () => {
  console.log("Clearing note detector");
  stringNotes.forEach((note) => note?.clear());
  stringNotes = [];
};
