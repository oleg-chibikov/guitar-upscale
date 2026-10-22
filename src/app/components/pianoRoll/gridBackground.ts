import { isSharp, Note, NOTE_COUNT } from "@/app/data/notes";
import {
  BEATS_IN_BAR,
  TICKS_IN_BEAT,
} from "@/app/data/pianoRollConstants";
import { Zoom } from "@/app/engine/pianoRoll/geometry";
import { CSSProperties } from "react";

const ROW_ROOT = "#4f6570";
const ROW_IN_SCALE = "#37474f";
const ROW_IN_SCALE_SHARP = "#2e3c43";
const ROW_OUT_OF_SCALE = "#1e272b";
const ROW_LINE = "rgba(0,0,0,0.35)";
const BAR_LINE = "#90a4ae";
const BEAT_LINE = "rgba(144,164,174,0.45)";
const SNAP_LINE = "rgba(144,164,174,0.16)";
const MIN_SNAP_LINE_SPACING_PX = 6;

const rowColor = (note: Note, scalePattern: Set<Note>, baseNote: Note) => {
  if (!scalePattern.has(note)) {
    return ROW_OUT_OF_SCALE;
  }
  if (note === baseNote) {
    return ROW_ROOT;
  }
  return isSharp(note) ? ROW_IN_SCALE_SHARP : ROW_IN_SCALE;
};

const verticalLines = (color: string, width: number, spacing: number) =>
  `repeating-linear-gradient(to right, ${color} 0 ${width}px, transparent ${width}px ${spacing}px)`;

/**
 * Rows and grid lines as CSS backgrounds. They scroll with the notes and cost no redraw.
 */
export const getGridBackground = (
  zoom: Zoom,
  snapTicks: number,
  scalePattern: Set<Note>,
  baseNote: Note
): CSSProperties => {
  const h = zoom.noteHeight;
  // each octave block starts with B at the top
  const rowStops = Array.from({ length: NOTE_COUNT }, (_, row) => {
    const color = rowColor(NOTE_COUNT - 1 - row, scalePattern, baseNote);
    return `${color} ${row * h}px ${(row + 1) * h - 1}px, ${ROW_LINE} ${
      (row + 1) * h - 1
    }px ${(row + 1) * h}px`;
  }).join(", ");

  const beatWidth = TICKS_IN_BEAT * zoom.pixelsPerTick;
  const barWidth = beatWidth * BEATS_IN_BAR;
  const snapWidth = snapTicks * zoom.pixelsPerTick;

  const layers = [verticalLines(BAR_LINE, 1, barWidth)];
  if (beatWidth >= MIN_SNAP_LINE_SPACING_PX) {
    layers.push(verticalLines(BEAT_LINE, 1, beatWidth));
  }
  if (snapWidth >= MIN_SNAP_LINE_SPACING_PX && snapWidth < beatWidth) {
    layers.push(verticalLines(SNAP_LINE, 1, snapWidth));
  }
  layers.push(`linear-gradient(to bottom, ${rowStops})`);

  return {
    backgroundImage: layers.join(", "),
    backgroundSize: [
      ...layers.slice(0, -1).map(() => "auto"),
      `100% ${NOTE_COUNT * h}px`,
    ].join(", "),
    backgroundRepeat: "repeat",
  };
};
