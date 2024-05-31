import { Chord, StringOctaveNote } from "../data/notes";
import { trailingDebounce } from "../helpers/debounce";
import { Trie } from "../helpers/trie";

type NoteWithClearCallback = {
  stringOctaveNote: StringOctaveNote;
  clear: () => void;
};
type MissingChar = "x" | "?";

export class ChordDetector {
  private stringNotes: (NoteWithClearCallback | null)[];
  private trie: Trie;
  private reverseChordsMap: Map<string, string>;
  private debouncedFindMatches: (showChord: (name: string) => void) => void;
  private findMatchesAutomatically: boolean;

  constructor(findMatchesAutomatically: boolean = true) {
    this.stringNotes = [];
    this.trie = new Trie();
    this.reverseChordsMap = new Map<string, string>();
    this.debouncedFindMatches = trailingDebounce(
      this.findMatches.bind(this),
      200
    );
    this.findMatchesAutomatically = findMatchesAutomatically;
  }

  createChordDetectorLookup() {
    this.trie = new Trie();
    this.reverseChordsMap = new Map<string, string>();
  }

  addChordToDetectorLookup(chord: Chord, fullKey: string) {
    const serializedChord = this.serializeChord(chord, "x");
    this.trie.add(serializedChord);
    this.reverseChordsMap.set(serializedChord, fullKey);
  }

  addNoteToDetector(
    note: NoteWithClearCallback,
    showChord: (name: string) => void
  ) {
    console.log("Adding note to chordDetector", note);
    // index in this array corresponds to the string of the note
    const index = note.stringOctaveNote.string;
    const existing = this.stringNotes[index];
    // only one note per string allowed
    existing?.clear();

    // clicked on the marked note
    if (existing?.stringOctaveNote.fret === note.stringOctaveNote.fret) {
      this.stringNotes[index] = null;
    } else {
      this.stringNotes[index] = note;
    }

    if (this.findMatchesAutomatically) {
      this.debouncedFindMatches(showChord);
    }
  }

  findMatches(showChord: (name: string) => void) {
    console.log("Detecting chord");
    const usedNotes = this.stringNotes.filter((x) => x);
    if (usedNotes.length <= 2) {
      return;
    }
    const serializedChord = this.serializeChord(
      usedNotes.map((x) => (x as NoteWithClearCallback).stringOctaveNote),
      "?" // wildcard - any char
    );
    const matchedValues = this.trie.wildcardMatches(serializedChord);
    console.log("Matched values from trie", matchedValues);
    const chordNames = Array.from(matchedValues).map((x) =>
      this.reverseChordsMap.get(x)
    );
    console.log("Matched chord names", chordNames);
    showChord(chordNames.join(", "));
  }

  clearDetector() {
    console.log("Clearing note detector");
    this.stringNotes.forEach((note) => note?.clear());
    this.stringNotes = [];
  }

  private serializeChord(chord: Chord, missingChar: MissingChar) {
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
  }
}

export const mainDetector = new ChordDetector();
