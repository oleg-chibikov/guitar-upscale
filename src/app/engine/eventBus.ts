import { Subject } from "rxjs";
import { StringOctaveNote, serializeStringOctaveNote } from "../data/notes";
import { midiRecorder } from "./midiRecorder";

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

NotePlayEventBus.subscribe((noteWithMetadata: NoteWithPlayMetadata) => {
  const serialized = serializeStringOctaveNote(noteWithMetadata.note);
  console.log("EventBus: Note play requested: " + serialized);
  const playAction = NoteToFretMarkerEventMap.get(serialized);
  if (noteWithMetadata.metadata.fromChord && playAction) {
    ClearChordMarkerSet.add(serialized);
  }

  midiRecorder.addNoteToMidiTrack(noteWithMetadata.note);

  playAction?.(noteWithMetadata.metadata);
});

export const clearPreviousChords = () => {
  for (const note of Array.from(ClearChordMarkerSet)) {
    const noteFromThePreviousChordAction = NoteToFretMarkerEventMap.get(note);
    noteFromThePreviousChordAction?.({ clearChordMarker: true });
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
