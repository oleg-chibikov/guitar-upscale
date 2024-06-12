import { Scale } from "@/app/data/scales";
import { NOTE_COUNT } from "@/app/engine/generateNeckRepresentation";
import { addOrUpdateMapArray } from "@/app/helpers/mapHelper";
import { Note } from "../../data/notes";
import { trailingDebounce } from "../../helpers/debounce";
import { Trie } from "../../helpers/trie";

type NoteWithClearCallback = {
  note: Note;
  clear: () => void; // clear the note
};

type MissingChar = "_" | "?";

export const MIN_NOTES_TO_DETECT_SCALE = 5;

class ScaleDetector {
  private currentlyDetectedNotes: Map<Note, () => void>;
  private trie: Trie;
  private reverseScalesMap: Map<string, string[]>;
  private debouncedFindMatches: () => void;
  private findMatchesAutomatically: boolean;
  private showScale?: (name: string) => void;

  constructor(
    findMatchesAutomatically: boolean = true,
    showScale?: (name: string) => void
  ) {
    this.currentlyDetectedNotes = new Map<Note, () => void>();
    this.trie = new Trie();
    this.reverseScalesMap = new Map<string, string[]>();
    this.debouncedFindMatches = trailingDebounce(
      this.findMatches.bind(this),
      200
    );
    this.findMatchesAutomatically = findMatchesAutomatically;
    this.showScale = showScale;
  }

  setScaleFoundCallback = (showScale?: (name: string) => void) => {
    this.showScale = showScale;
  };

  clone(findMatchesAutomatically: boolean) {
    // use this function to avoid populating the new detector afresh
    const cloned = new ScaleDetector(findMatchesAutomatically);
    cloned.trie = this.trie;
    cloned.reverseScalesMap = this.reverseScalesMap;
    //  cloned.showScale = this.showScale;
    return cloned;
  }

  addScaleToDetectorLookup(scale: Scale, fullKey: string) {
    // if (fullKey.indexOf("omati") > -1) {
    //   debugger;
    // }
    const serializedScale = this.serializeScale(scale, "_");
    this.trie.add(serializedScale);
    addOrUpdateMapArray(this.reverseScalesMap, serializedScale, fullKey);
  }

  addNoteToDetector(note: NoteWithClearCallback) {
    // index in this array corresponds to the string of the note
    const existingNoteClearCallback = this.currentlyDetectedNotes.get(
      note.note
    );
    if (existingNoteClearCallback !== undefined) {
      console.log("Deleting note to scaleDetector", note);
      existingNoteClearCallback();
      this.currentlyDetectedNotes.delete(note.note);
    } else {
      console.log("Adding note to scaleDetector", note);
      this.currentlyDetectedNotes.set(note.note, note.clear);
    }

    if (this.findMatchesAutomatically) {
      this.debouncedFindMatches();
    }
  }

  findMatches() {
    console.log("Detecting scale");
    const usedNotes = this.currentlyDetectedNotes;
    if (usedNotes.size < MIN_NOTES_TO_DETECT_SCALE) {
      return;
    }
    const serializedScale = this.serializeScale(
      Array.from(usedNotes.keys()),
      "?"
    );
    const matchedValues = this.trie.wildcardMatches(serializedScale);
    console.log("Matched values from trie", matchedValues);
    const scaleNames = Array.from(matchedValues)
      .flatMap((x) => this.reverseScalesMap.get(x))
      .filter((x) => x) as string[];
    const deduplicatedScaleNames = Array.from(new Set(scaleNames)).sort();
    console.log("Matched scale names", deduplicatedScaleNames);
    this.showScale?.(deduplicatedScaleNames.join(", "));
    return deduplicatedScaleNames;
  }

  clearDetector() {
    console.log("Clearing scale detector");

    this.currentlyDetectedNotes.forEach((clearCallback) => clearCallback());
    this.currentlyDetectedNotes = new Map<Note, () => void>();
  }

  private serializeScale(scale: Scale, missingChar: MissingChar) {
    const serializedScale: (number | MissingChar)[] = [];

    // Initialize the serializedScale with the placeholder for each position
    for (let i = 0; i < NOTE_COUNT; i++) {
      serializedScale.push(missingChar);
    }

    // Populate serializedScale with the set note values
    scale.forEach((note) => {
      serializedScale[note] = 1;
    });

    return serializedScale.join("");
  }
}

export const mainScaleDetector = new ScaleDetector();
