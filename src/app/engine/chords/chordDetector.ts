import { AlertType } from "@/app/data/alertType";
import { sortChords } from "@/app/engine/chords/chordsSorter";
import { MissingChar } from "@/app/engine/detectorShared";
import { STRING_COUNT } from "@/app/engine/generateNeckRepresentation";
import { addOrUpdateMapArray } from "@/app/helpers/mapHelper";
import { Chord, StringOctaveNote } from "../../data/notes";
import { Trie } from "../../helpers/trie";

export type ChordDetectorCallbackData =
  | {
      text: string;
      alertType?: AlertType;
      chords?: undefined;
    }
  | {
      chords: string[];
      text?: undefined;
      alertType?: undefined;
    };

// TODO: Merge class with scaleDetector
const START_ASCII_CODE = "a".charCodeAt(0);
export const MIN_NOTES_TO_DETECT_CHORD = 3;

class ChordDetector {
  private trie: Trie;
  private reverseChordsMap: Map<string, string[]>;

  constructor() {
    this.trie = new Trie();
    this.reverseChordsMap = new Map<string, string[]>();
  }

  addChordToDetectorLookup(chord: Chord, fullKey: string) {
    const serializedChord = this.serializeChord(chord, "_");
    this.trie.add(serializedChord);
    addOrUpdateMapArray(this.reverseChordsMap, serializedChord, fullKey);
  }

  findMatches(
    notes: StringOctaveNote[],
    callback: (data: ChordDetectorCallbackData) => void
  ) {
    console.log("Detecting chord");
    if (notes.length < MIN_NOTES_TO_DETECT_CHORD) {
      callback({
        text:
          "Select " +
          (MIN_NOTES_TO_DETECT_CHORD - notes.length) +
          " more notes to detect the chord",
        alertType: AlertType.Neutral,
      });
      return;
    }
    const serializedChord = this.serializeChord(
      notes,
      "?" // wildcard - any char
    );
    const matchedValues = this.trie.wildcardMatches(serializedChord);
    console.log("Matched values from trie", matchedValues);
    const chordNames = Array.from(matchedValues)
      .flatMap((x) => this.reverseChordsMap.get(x))
      .filter((x) => x) as string[];
    if (!chordNames.length) {
      console.warn("No chords matched to the values from trie");
      callback({
        text: "No chords matched",
        alertType: AlertType.Warning,
      });
      return;
    }
    const deduplicatedChordNames = Array.from(new Set(chordNames));
    const sortedChordNames = sortChords(deduplicatedChordNames);
    console.log("Matched chord names", sortedChordNames);
    callback({ chords: sortedChordNames });
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

export const chordDetector = new ChordDetector();
