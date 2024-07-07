import { TICKS_IN_BEAT } from "@/app/data/clockConstants";
import { Note } from "@/app/data/notes";

export const PIXELS_PER_TICK = 2;
export const BEAT_WIDTH = TICKS_IN_BEAT * PIXELS_PER_TICK;
export const TOTAL_BEATS = 100;
export const TOTAL_WIDTH = TOTAL_BEATS * BEAT_WIDTH;
export const OCTAVE_COUNT = 9; // 0-8 octaves
export const NOTE_HEIGHT = 20; // Should match the NOTE_HEIGHT in getPitchPosition
export const allNotes = Object.values(Note)
  .filter((note): note is Note => typeof note === "number")
  .reverse();
export const TOTAL_HEIGHT = NOTE_HEIGHT * allNotes.length * OCTAVE_COUNT;
