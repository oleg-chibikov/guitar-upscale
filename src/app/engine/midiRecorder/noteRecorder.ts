import { Instrument } from "@/app/data/instruments";
import { StringOctaveNote } from "@/app/data/notes";

export interface NoteRecorder {
  addNoteAtTick(
    note: StringOctaveNote,
    trackNumber: number,
    instrument: Instrument,
    tick: number
  ) : void;
}
