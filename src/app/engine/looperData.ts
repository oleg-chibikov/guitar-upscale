import { Instrument } from "@/app/data/instruments";
import { StringOctaveNote } from "@/app/data/notes";
import { ChordWithPlayMetadata } from "@/app/engine/eventBus";

export type InternalNoteEvent = {
  note: StringOctaveNote;
  looperChannel: number;
  trackNumber: number;
  instrument: Instrument;
};

export type ChordOrNote = {
  note?: InternalNoteEvent;
  chord?: ChordWithPlayMetadata;
};
