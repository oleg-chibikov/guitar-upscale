import { Subject } from "rxjs";
import { StringOctaveNote, serializeStringOctaveNote } from "../data/notes";

export const NotePlayEventBus = new Subject<StringOctaveNote>();

export const NoteMap: Map<string, () => void> = new Map<string, () => void>();

NotePlayEventBus.subscribe((note: StringOctaveNote) => {
  const serialized = serializeStringOctaveNote(note);
  console.log("EventBus: Note play requested: " + serialized);
  const playAction = NoteMap.get(serialized);
  playAction?.();
});
