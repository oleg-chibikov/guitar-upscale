import { Subject } from "rxjs";
import { StringOctaveNote, serializeStringOctaveNote } from "../data/notes";

export const NotePlayEventBus = new Subject<StringOctaveNote>();
export const ChordEventBus = new Subject<string>();

export const NoteToFretMarkerEventMap: Map<string, () => void> = new Map<
  string,
  () => void
>();

export const ChordToChordButtonEventMap: Map<string, () => void> = new Map<
  string,
  () => void
>();

NotePlayEventBus.subscribe((note: StringOctaveNote) => {
  const serialized = serializeStringOctaveNote(note);
  console.log("EventBus: Note play requested: " + serialized);
  const playAction = NoteToFretMarkerEventMap.get(serialized);

  playAction?.();
});

ChordEventBus.subscribe((chord: string) => {
  console.log("EventBus: chord play requested: " + chord);
  const playAction = ChordToChordButtonEventMap.get(chord);

  playAction?.();
});
