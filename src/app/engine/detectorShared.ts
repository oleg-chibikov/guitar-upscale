import { StringOctaveNote } from "@/app/data/notes";

export type NoteWithClearCallback = {
  stringOctaveNote: StringOctaveNote;
  clear?: () => void; // clear the previous note (for chord detector - on the same string, for scale detector - with the same value)
};

export type MissingChar = "_" | "?";
