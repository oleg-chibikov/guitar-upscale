import { Instrument } from "@/app/data/instruments";
import { StringOctaveNote } from "@/app/data/notes";
import { ChordWithPlayMetadata } from "@/app/engine/eventBus";

export type NoteEvent = {
  note: StringOctaveNote;
  trackNumber: number;
  instrument: Instrument;
  velocity?: number;
};

export type LooperNoteEvent = NoteEvent & {
  looperChannel: number;
};

export type ChordOrNote = {
  note?: LooperNoteEvent;
  chord?: ChordWithPlayMetadata;
};
