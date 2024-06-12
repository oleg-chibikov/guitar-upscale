import { OctaveNote } from "@/app/data/notes";

export type NotePlayEvent = {
  tick: number;
  octaveNote: OctaveNote;
  duration: number;
  velocity: number;
};
