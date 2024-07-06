import { AlertType } from "@/app/data/alertType";
import { ChordDetectorCallbackData } from "@/app/data/chordDetectorWorkerTypes";
import { StringOctaveNote } from "@/app/data/notes";
import { chordDetectorWorkerApi } from "@/app/engine/chords/chordDetectorWorkerApi";
import { NoteWithClearCallback } from "@/app/engine/detectorShared";
import { store } from "@/app/store/store";
import { setAndShowAlert } from "@/app/store/uiSlice";
import { trailingDebounce } from "../../helpers/debounce";

class ChordDetectorBuilder {
  private currentlyDetectedNotesByString: (NoteWithClearCallback | null)[];
  private debouncedFindMatches: (
    notes: StringOctaveNote[],
    callback: (data: ChordDetectorCallbackData) => void
  ) => void;

  constructor() {
    this.currentlyDetectedNotesByString = [];
    this.debouncedFindMatches = trailingDebounce(
      chordDetectorWorkerApi.findMatches.bind(chordDetectorWorkerApi),
      200
    );
  }

  addNote(note: NoteWithClearCallback) {
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

    this.debouncedFindMatches(
      (
        this.currentlyDetectedNotesByString.filter(
          (x) => x
        ) as NoteWithClearCallback[]
      ).map((x) => x.stringOctaveNote),
      this.displayAlert
    );
  }

  clear() {
    console.log("Clearing chord detector");
    this.currentlyDetectedNotesByString.forEach((note) => note?.clear?.());
    this.currentlyDetectedNotesByString = [];
  }

  private displayAlert(data: ChordDetectorCallbackData) {
    store.dispatch(
      setAndShowAlert({
        message: data.chords ? data.chords.join("\n") : data.text,
        alertType:
          data.alertType ??
          (data.chords !== undefined && data.chords.length > 0
            ? AlertType.Success
            : AlertType.Warning),
        alertTimeout: 5000,
      })
    );
  }
}

export const chordDetectorBuilder = new ChordDetectorBuilder();
