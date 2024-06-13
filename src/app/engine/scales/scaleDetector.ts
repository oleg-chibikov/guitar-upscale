import { AlertType } from "@/app/data/alertType";
import { getNoteText, serializeStringOctaveNote } from "@/app/data/notes";
import { Scale } from "@/app/data/scales";
import {
  MissingChar,
  NoteWithClearCallback,
} from "@/app/engine/detectorShared";
import { NOTE_COUNT } from "@/app/engine/generateNeckRepresentation";
import { ScaleAndGroup } from "@/app/engine/scales/scaleLookupBuilder";
import { addOrUpdateMapArray } from "@/app/helpers/mapHelper";
import { trailingDebounce } from "../../helpers/debounce";
import { Trie } from "../../helpers/trie";

// TODO: Merge with ChordDetector
export const MIN_NOTES_TO_DETECT_SCALE = 5;

class ScaleDetector {
  private usedNotesCount: number = 0;
  private currentlyDetectedNotes: (NoteWithClearCallback | undefined)[];
  private trie: Trie;
  private reverseScalesMap: Map<string, ScaleAndGroup[]>;
  private debouncedFindMatches: () => void;
  private findMatchesAutomatically: boolean;
  private alert?: (name: string, alertType?: AlertType) => void;

  constructor(
    findMatchesAutomatically: boolean = true,
    alert?: (name: string, alertType?: AlertType) => void
  ) {
    this.currentlyDetectedNotes = this.initArray();
    this.trie = new Trie();
    this.reverseScalesMap = new Map<string, ScaleAndGroup[]>();
    this.debouncedFindMatches = trailingDebounce(
      this.findMatches.bind(this),
      200
    );
    this.findMatchesAutomatically = findMatchesAutomatically;
    this.alert = alert;
  }

  setScaleFoundCallback = (
    alert?: (name: string, alertType?: AlertType) => void
  ) => {
    this.alert = alert;
  };

  clone(findMatchesAutomatically: boolean) {
    // use this function to avoid populating the new detector afresh
    const cloned = new ScaleDetector(findMatchesAutomatically);
    cloned.trie = this.trie;
    cloned.reverseScalesMap = this.reverseScalesMap;
    //  cloned.alert = this.alert;
    return cloned;
  }

  addScaleToDetectorLookup(scale: Scale, scaleData: ScaleAndGroup) {
    // if (fullKey.indexOf("omati") > -1) {
    //   debugger;
    // }
    const serializedScale = this.serializeScale(scale, "_");
    this.trie.add(serializedScale);
    addOrUpdateMapArray(this.reverseScalesMap, serializedScale, scaleData);
  }

  addNoteToDetector(noteData: NoteWithClearCallback) {
    const serializedNote = serializeStringOctaveNote(noteData.stringOctaveNote);
    // index in this array corresponds to the string of the note
    const note = noteData.stringOctaveNote.note;
    const existingNoteMetadata = this.currentlyDetectedNotes[note];
    if (existingNoteMetadata !== undefined) {
      const currentlyMappedStringOctaveNote =
        existingNoteMetadata.stringOctaveNote;
      existingNoteMetadata.clear?.();
      if (
        serializedNote ===
        serializeStringOctaveNote(currentlyMappedStringOctaveNote)
      ) {
        // exactly the same note exists - just remove
        console.log("Deleting note from scaleDetector", noteData);
        this.currentlyDetectedNotes[note] = undefined;
        this.usedNotesCount--;
      } else {
        console.log("Moving existing note in scaleDetector", noteData);
        this.currentlyDetectedNotes[note] = noteData;
      }
    } else {
      console.log("Adding note to scaleDetector", noteData);
      this.currentlyDetectedNotes[note] = noteData;
      this.usedNotesCount++;
    }

    if (this.findMatchesAutomatically) {
      this.debouncedFindMatches();
    }
  }

  findMatches() {
    console.log("Detecting scale");

    if (this.usedNotesCount < MIN_NOTES_TO_DETECT_SCALE) {
      const remaining = MIN_NOTES_TO_DETECT_SCALE - this.usedNotesCount;
      this.alert?.(
        "Select " + remaining + " more notes to detect the scale",
        AlertType.Neutral
      );
      return;
    }
    const serializedScale = this.currentlyDetectedNotes
      .map((x) => (x ? 1 : "?"))
      .join("");
    const matchedValues = this.trie.wildcardMatches(serializedScale);
    console.log("Matched values from trie", matchedValues);
    const scaleNames = Array.from(matchedValues)
      .flatMap((x) => this.reverseScalesMap.get(x))
      .filter((x) => x) as ScaleAndGroup[];
    const deduplicatedScaleNames = Array.from(
      new Set(
        scaleNames.map(
          (x) => `${x.group}: ` + getNoteText(x.note) + " " + x.scale
        )
      )
    ).sort();
    console.log("Matched scale names", deduplicatedScaleNames);
    this.alert?.(deduplicatedScaleNames.join("\n"));
    return deduplicatedScaleNames;
  }

  clearDetector() {
    console.log("Clearing scale detector");

    this.currentlyDetectedNotes.forEach((data) => data?.clear?.());
    this.currentlyDetectedNotes = this.initArray();
    this.usedNotesCount = 0;
  }

  private initArray() {
    return Array.from({ length: NOTE_COUNT }, (_, index) => undefined);
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
