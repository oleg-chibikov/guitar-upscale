import { Subject } from "rxjs";
import { StringOctaveNote, serializeStringOctaveNote } from "../data/notes";

export const NotePlayEventBus = new Subject<StringOctaveNote>();

export const NoteMap: Map<string, () => void> = new Map<string, () => void>();

NotePlayEventBus.subscribe((note: StringOctaveNote) => {
  const playAction = NoteMap.get(serializeStringOctaveNote(note));
  playAction?.();
});
