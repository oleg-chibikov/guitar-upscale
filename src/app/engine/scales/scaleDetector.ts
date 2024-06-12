import { addOrUpdateMapArray } from "@/app/helpers/mapHelper";
import { Note, StringOctaveNote } from "../../data/notes";
import { trailingDebounce } from "../../helpers/debounce";
import { Trie } from "../../helpers/trie";

type NoteWithClearCallback = {
  stringOctaveNote: StringOctaveNote;
  clear?: () => void;
};

type MissingChar = "_" | "?";

const START_ASCII_CODE = "a".charCodeAt(0);
export const MIN_NOTES_TO_DETECT_SCALE = 3;

class ScaleDetector {
  private stringNotes: (NoteWithClearCallback | null)[];
  private trie: Trie;
  private reverseScalesMap: Map<string, string[]>;
  private debouncedFindMatches: () => void;
  private findMatchesAutomatically: boolean;
  private showScale?: (name: string) => void;

  constructor(
    findMatchesAutomatically: boolean = true,
    showScale?: (name: string) => void
  ) {
    this.stringNotes = [];
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

  addScaleToDetectorLookup(scale: Note[], fullKey: string) {
    const serializedScale = this.serializeScale(scale, "_");
    this.trie.add(serializedScale);
    addOrUpdateMapArray(this.reverseScalesMap, serializedScale, fullKey);
  }

  addNoteToDetector(note: NoteWithClearCallback) {
    console.log("Adding note to scaleDetector", note);
    // index in this array corresponds to the string of the note
    const index = note.stringOctaveNote.string;
    const existing = this.stringNotes[index];
    // only one note per string allowed
    existing?.clear?.();

    // clicked on the marked note
    if (existing?.stringOctaveNote.fret === note.stringOctaveNote.fret) {
      this.stringNotes[index] = null;
    } else {
      this.stringNotes[index] = note;
    }

    if (this.findMatchesAutomatically) {
      this.debouncedFindMatches();
    }
  }

  findMatches() {
    console.log("Detecting scale");
    // TODO
  }

  clearDetector() {
    console.log("Clearing scale detector");
    this.stringNotes.forEach((note) => note?.clear?.());
    this.stringNotes = [];
  }

  private serializeScale(scale: Note[], missingChar: MissingChar) {
    // Convert note values to string and return the serialized scale
    // to keep each value 1 char length - the numeric values are converted to corresponding char codes starting from 'a'
    return scale
      .map((item) =>
        typeof item === "number"
          ? String.fromCharCode(item + START_ASCII_CODE)
          : item
      )
      .join("");
  }
}

export const mainDetector = new ScaleDetector();
