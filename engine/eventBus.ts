import { Subject } from "rxjs";
import { StringOctaveNote, serializeStringOctaveNote } from "../data/notes";

export type NoteMetadata = {
  fromChord?: boolean;
  clearChordMarker?: boolean;
};

export type ChordMetadata = {
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

export const NotePlayEventBus = new Subject<NoteWithPlayMetadata>();
export const ChordEventBus = new Subject<ChordWithPlayMetadata>();

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

NotePlayEventBus.subscribe((note: NoteWithPlayMetadata) => {
  const serialized = serializeStringOctaveNote(note.note);
  console.log("EventBus: Note play requested: " + serialized);
  const playAction = NoteToFretMarkerEventMap.get(serialized);
  if (note.metadata.fromChord && playAction) {
    ClearChordMarkerSet.add(serialized);
  }

  playAction?.(note.metadata);
});

ChordEventBus.subscribe((chord: ChordWithPlayMetadata) => {
  console.log("EventBus: chord play requested: " + chord);
  for (const note of ClearChordMarkerSet) {
    const noteFromThePreviousChordAction = NoteToFretMarkerEventMap.get(note);
    noteFromThePreviousChordAction?.({ clearChordMarker: true });
  }
  ClearChordMarkerSet.clear(); // clear previous chord;

  const playAction = ChordToChordButtonEventMap.get(chord.chord);

  playAction?.(chord.metadata);
  lastChord = chord.chord;
});
