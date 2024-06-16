import { initNotesArray, serializeStringOctaveNote } from "@/app/data/notes";
import { NoteWithClearCallback } from "@/app/engine/detectorShared";
import {
  ScaleDetectorCallbackData,
  scaleDetector,
} from "@/app/engine/scales/scaleDetector";
import { store } from "@/app/store/store";
import { setAndShowAlert, setSuggestedScales } from "@/app/store/uiSlice";
import { trailingDebounce } from "../../helpers/debounce";

class ScaleDetectorBuilder {
  private usedNotesCount: number = 0;
  private currentlyDetectedNotes: (NoteWithClearCallback | undefined)[];
  private debouncedFindMatches: (
    notes: (unknown | undefined)[],
    usedNotesCount: number,
    callback: (data: ScaleDetectorCallbackData) => void
  ) => void;

  constructor() {
    this.currentlyDetectedNotes = initNotesArray();
    this.debouncedFindMatches = trailingDebounce(
      scaleDetector.findMatches.bind(scaleDetector),
      200
    );
  }

  addNote(noteData: NoteWithClearCallback) {
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

    this.debouncedFindMatches(
      this.currentlyDetectedNotes,
      this.usedNotesCount,
      this.displayAlert
    );
  }

  clear() {
    console.log("Clearing scale detector");

    this.currentlyDetectedNotes.forEach((data) => data?.clear?.());
    this.currentlyDetectedNotes = initNotesArray();
    this.usedNotesCount = 0;
  }

  private displayAlert(data: ScaleDetectorCallbackData) {
    if (data.scales === undefined) {
      store.dispatch(
        setAndShowAlert({
          message: data.text,
          alertType: data.alertType,
          alertTimeout: 5000,
        })
      );
    } else {
      store.dispatch(setSuggestedScales(data.scales));
    }
  }
}

export const scaleDetectorBuilder = new ScaleDetectorBuilder();
