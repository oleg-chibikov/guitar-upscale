import { Subject } from "rxjs";
import { Instrument } from "../data/instruments";
import { StringOctaveNote, serializeStringOctaveNote } from "../data/notes";

export type TrackMetadata = {
  trackNumber?: number;
  instrument?: Instrument;
};

export type NoteMetadata = TrackMetadata & {
  fromChord?: boolean;
  clearChordMarker?: boolean;
};

export type ChordMetadata = TrackMetadata & {
  notesToPlay?: number;
  strummingDelayMs?: number;
};

export type NoteWithPlayMetadata = {
  note: StringOctaveNote;
  metadata: NoteMetadata;
};

export type ChordWithPlayMetadata = {
  chord: string;
  metadata: ChordMetadata;
};

type Tick = {
  isBeat: boolean;
  tick: number;
};

export const NotePlayEventBus = new Subject<NoteWithPlayMetadata>();
export const ChordEventBus = new Subject<ChordWithPlayMetadata>();
export const MetronomeEventBus = new Subject<Tick>();

export const NoteToFretMarkerEventMap: Map<
  string,
  (metadata: NoteMetadata) => void
> = new Map<string, () => void>();

export const ChordToChordButtonEventMap: Map<
  string,
  (metadata: ChordMetadata) => void
> = new Map<string, (metadata: ChordMetadata) => void>();

export const ClearChordMarkerSet: Set<string> = new Set<string>();

let lastChord: string | undefined;

NotePlayEventBus.subscribe(async (noteWithMetadata: NoteWithPlayMetadata) => {
  const serialized = serializeStringOctaveNote(noteWithMetadata.note);
  console.log("EventBus: Note play requested: " + serialized);
  const playAction = NoteToFretMarkerEventMap.get(serialized);
  if (noteWithMetadata.metadata.fromChord && playAction) {
    ClearChordMarkerSet.add(serialized);
  }

  const midiRecorder = (await import("./midiRecorder")).midiRecorder;
  midiRecorder.addNoteToMidiTrack(noteWithMetadata.note);

  playAction?.(noteWithMetadata.metadata);
});

export const clearPreviousChords = () => {
  for (const note of Array.from(ClearChordMarkerSet)) {
    const noteFromThePreviousChordAction = NoteToFretMarkerEventMap.get(note);
    noteFromThePreviousChordAction?.({
      clearChordMarker: true,
      trackNumber: 0,
    });
  }
  ClearChordMarkerSet.clear(); // clear previous chord;
};

ChordEventBus.subscribe((chord: ChordWithPlayMetadata) => {
  console.log("EventBus: chord play requested: " + chord);
  clearPreviousChords();

  const playAction = ChordToChordButtonEventMap.get(chord.chord);

  playAction?.(chord.metadata);
  lastChord = chord.chord;
});
