import {
  BEATS_IN_BAR,
  TICKS_IN_BAR,
  TICKS_IN_BEAT,
} from "@/app/data/clockConstants";
import { NOTE_COUNT } from "@/app/data/notes";

export const OCTAVE_COUNT = 9; // 0-8 octaves
export const PITCH_COUNT = OCTAVE_COUNT * NOTE_COUNT;

export const DEFAULT_PIXELS_PER_TICK = 2;
export const MIN_PIXELS_PER_TICK = 0.25;
export const MAX_PIXELS_PER_TICK = 16;

export const DEFAULT_NOTE_HEIGHT = 20;
export const MIN_NOTE_HEIGHT = 8;
export const MAX_NOTE_HEIGHT = 48;

export const ZOOM_STEP = 1.25;

export const PITCH_AXIS_WIDTH = 112;
export const TIMELINE_HEIGHT = 32;

export const MIN_BARS = 25;
// room to draw after the last note
export const TRAILING_BARS = 8;

export const DEFAULT_EVENT_DURATION = TICKS_IN_BEAT;
// octave for chords that were recorded without a root octave
export const DEFAULT_CHORD_OCTAVE = 3;

// pointer has to travel this far before a press turns into a drag
export const DRAG_THRESHOLD_PX = 4;
// the part of a note near its edge that resizes instead of moving
export const RESIZE_HANDLE_PX = 6;
export const LONG_PRESS_MS = 400;

export { BEATS_IN_BAR, TICKS_IN_BAR, TICKS_IN_BEAT };
