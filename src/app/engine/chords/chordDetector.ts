import { AlertType } from "@/app/data/alertType";
import { sortChords } from "@/app/engine/chords/chordsSorter";
import {
  MissingChar,
  NoteWithClearCallback,
} from "@/app/engine/detectorShared";
import { STRING_COUNT } from "@/app/engine/generateNeckRepresentation";
import { addOrUpdateMapArray } from "@/app/helpers/mapHelper";
import { Chord } from "../../data/notes";
import { trailingDebounce } from "../../helpers/debounce";
import { Trie } from "../../helpers/trie";

// TODO: Merge class with scaleDetector
const START_ASCII_CODE = "a".charCodeAt(0);
export const MIN_NOTES_TO_DETECT_CHORD = 3;

class ChordDetector {
  private currentlyDetectedNotesByString: (NoteWithClearCallback | null)[];
  private trie: Trie;
  private reverseChordsMap: Map<string, string[]>;
  private debouncedFindMatches: () => void;
  private findMatchesAutomatically: boolean;
  private alert?: (name: string, alertType?: AlertType) => void;

  constructor(
    findMatchesAutomatically: boolean = true,
    alert?: (name: string, alertType?: AlertType) => void
  ) {
    this.currentlyDetectedNotesByString = [];
    this.trie = new Trie();
    this.reverseChordsMap = new Map<string, string[]>();
    this.debouncedFindMatches = trailingDebounce(
      this.findMatches.bind(this),
      200
    );
    this.findMatchesAutomatically = findMatchesAutomatically;
    this.alert = alert;
  }

  setChordFoundCallback = (
    alert?: (name: string, alertType?: AlertType) => void
  ) => {
    this.alert = alert;
  };

  clone(findMatchesAutomatically: boolean) {
    // use this function to avoid populating the new detector afresh
    const cloned = new ChordDetector(findMatchesAutomatically);
    cloned.trie = this.trie;
    cloned.reverseChordsMap = this.reverseChordsMap;
    //  cloned.showChord = this.showChord;
    return cloned;
  }

  addChordToDetectorLookup(chord: Chord, fullKey: string) {
    const serializedChord = this.serializeChord(chord, "_");
    this.trie.add(serializedChord);
    addOrUpdateMapArray(this.reverseChordsMap, serializedChord, fullKey);
  }

  addNoteToDetector(note: NoteWithClearCallback) {
    // index in this array corresponds to the string of the note
    const index = note.stringOctaveNote.string;
    const existing = this.currentlyDetectedNotesByString[index];
    // only one note per string allowed
    if (existing?.clear) {
      existing.clear();
    }

    // clicked on the marked note
    if (existing?.stringOctaveNote.fret === note.stringOctaveNote.fret) {
      console.log("Deleting note from chordDetector", note);
      this.currentlyDetectedNotesByString[index] = null;
    } else {
      console.log("Adding note to chordDetector", note);
      this.currentlyDetectedNotesByString[index] = note;
    }

    if (this.findMatchesAutomatically) {
      this.debouncedFindMatches();
    }
  }

  findMatches() {
    console.log("Detecting chord");
    const usedNotes = this.currentlyDetectedNotesByString.filter((x) => x);
    if (usedNotes.length < MIN_NOTES_TO_DETECT_CHORD) {
      this.alert?.(
        "Select " +
          (MIN_NOTES_TO_DETECT_CHORD - usedNotes.length) +
          " more notes to detect the chord",
        AlertType.Neutral
      );
      return;
    }
    const serializedChord = this.serializeChord(
      usedNotes.map((x) => (x as NoteWithClearCallback).stringOctaveNote),
      "?" // wildcard - any char
    );
    const matchedValues = this.trie.wildcardMatches(serializedChord);
    console.log("Matched values from trie", matchedValues);
    const chordNames = Array.from(matchedValues)
      .flatMap((x) => this.reverseChordsMap.get(x))
      .filter((x) => x) as string[];
    const deduplicatedChordNames = Array.from(new Set(chordNames));
    const sortedChordNames = sortChords(deduplicatedChordNames);
    console.log("Matched chord names", sortedChordNames);
    this.alert?.(sortedChordNames.join("\n"));
    return sortedChordNames;
  }

  clearDetector() {
    console.log("Clearing chord detector");
    this.currentlyDetectedNotesByString.forEach((note) => note?.clear?.());
    this.currentlyDetectedNotesByString = [];
  }

  private serializeChord(chord: Chord, missingChar: MissingChar) {
    const serializedChord: (number | MissingChar)[] = [];

    // Initialize the serializedChord with '?' for each position
    for (let i = 0; i < STRING_COUNT; i++) {
      serializedChord.push(missingChar);
    }

    // Populate serializedChord with note values where string is set
    chord.forEach((stringOctaveNote) => {
      serializedChord[stringOctaveNote.string] = stringOctaveNote.fret;
    });

    // Convert note values to string and return the serialized chord
    // to keep each value 1 char length - the numeric values are converted to corresponding char codes starting from 'a'
    return serializedChord
      .map((item) =>
        typeof item === "number"
          ? String.fromCharCode(item + START_ASCII_CODE)
          : item
      )
      .join("");
  }
}

export const mainChordDetector = new ChordDetector();
