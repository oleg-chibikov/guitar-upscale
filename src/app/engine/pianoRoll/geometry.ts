import { NOTE_COUNT, OctaveNote } from "@/app/data/notes";
import {
  MIN_BARS,
  PITCH_COUNT,
  TICKS_IN_BAR,
  TRAILING_BARS,
} from "@/app/data/pianoRollConstants";

export type Zoom = {
  pixelsPerTick: number;
  noteHeight: number;
};

// pitch is a semitone index: octave * 12 + note
export const toPitch = ({ octave, note }: OctaveNote): number =>
  octave * NOTE_COUNT + note;

export const fromPitch = (pitch: number): OctaveNote => ({
  octave: Math.floor(pitch / NOTE_COUNT),
  note: ((pitch % NOTE_COUNT) + NOTE_COUNT) % NOTE_COUNT,
});

export const clampPitch = (pitch: number) =>
  Math.max(0, Math.min(PITCH_COUNT - 1, pitch));

// the highest pitch sits at the top
export const pitchToY = (pitch: number, zoom: Zoom) =>
  (PITCH_COUNT - 1 - pitch) * zoom.noteHeight;

export const yToPitch = (y: number, zoom: Zoom) =>
  clampPitch(PITCH_COUNT - 1 - Math.floor(y / zoom.noteHeight));

export const tickToX = (tick: number, zoom: Zoom) => tick * zoom.pixelsPerTick;

export const xToTick = (x: number, zoom: Zoom) =>
  Math.max(0, x / zoom.pixelsPerTick);

export const getContentHeight = (zoom: Zoom) => PITCH_COUNT * zoom.noteHeight;

export const getTotalTicks = (lastEventEndTick: number) =>
  Math.max(
    MIN_BARS * TICKS_IN_BAR,
    (Math.ceil(lastEventEndTick / TICKS_IN_BAR) + TRAILING_BARS) * TICKS_IN_BAR
  );
