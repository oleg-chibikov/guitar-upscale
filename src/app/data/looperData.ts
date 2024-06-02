import { Instrument } from "@/app/data/instruments";
import { StringOctaveNote } from "@/app/data/notes";
import { ChordWithPlayMetadata } from "@/app/engine/eventBus";

export type NoteEvent = {
  note: StringOctaveNote;
  trackNumber: number;
  instrument: Instrument;
  velocity?: number;
  looperChannel?: number;
};

export type ChordOrNote = {
  note?: NoteEvent;
  chord?: ChordWithPlayMetadata;
};
