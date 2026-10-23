import type { Preview } from "@/app/components/pianoRoll/useNoteAreaInteraction";
import { isSharp, Note, NOTE_COUNT, serializeOctaveNote } from "@/app/data/notes";
import {
  BEATS_IN_BAR,
  PITCH_AXIS_WIDTH,
  PITCH_COUNT,
  RESIZE_HANDLE_PX,
  TICKS_IN_BAR,
  TICKS_IN_BEAT,
  TIMELINE_HEIGHT,
} from "@/app/data/pianoRollConstants";
import { MAX_VOLUME } from "@/app/data/volume";
import { ChordOrNote, getChordOrNoteText } from "@/app/engine/eventsByTick";
import { fromPitch, pitchToY, tickToX, Zoom } from "@/app/engine/pianoRoll/geometry";
import {
  getEventDuration,
  getEventPitch,
  isChordEvent,
  isChordModeAvailable,
  withPitch,
} from "@/app/engine/pianoRoll/pianoRollEvent";
import { getEventTrack } from "@/app/engine/pianoRoll/pianoRollTracks";
import { ResizeEdge } from "@/app/engine/pianoRoll/operations";

export const BACKGROUND = "#1e272b";
const ROW_ROOT = "#4f6570";
const ROW_IN_SCALE = "#37474f";
const ROW_IN_SCALE_SHARP = "#2e3c43";
const ROW_OUT_OF_SCALE = "#1e272b";
const ROW_LINE = "rgba(0,0,0,0.35)";
const KEY_WHITE = "#FFFFFF";
const KEY_BLACK = "#000000";
const KEY_WHITE_OUT_OF_SCALE = "#FBCFE8";
const KEY_BLACK_OUT_OF_SCALE = "#831843";
const KEY_LABEL_WHITE = "#6B7280";
const KEY_LABEL_BLACK = "#9CA3AF";
const KEY_LABEL_OUT_OF_SCALE = "#BE185D";
const KEY_LABEL_BLACK_OUT_OF_SCALE = "#F9A8D4";
const BAR_LINE = "#90a4ae";
const BEAT_LINE = "rgba(144,164,174,0.45)";
const SNAP_LINE = "rgba(144,164,174,0.16)";
const MIN_LINE_SPACING_PX = 6;
const MIN_BAR_LABEL_SPACING_PX = 32;
const MIN_LABEL_WIDTH_PX = 18;
const BLACK_KEY_WIDTH = PITCH_AXIS_WIDTH * 0.6;
const LABEL_FONT_FAMILY = "ui-sans-serif, system-ui, sans-serif";
const PLAYHEAD = "#ef4444";
const LOOP_END = "#fbbf24";
const LOOP_RANGE = "#22d3ee";

// Tailwind colours of the old DOM notes
const NOTE_COLORS = {
  chord: { fill: "#3b82f6", border: "#1e3a8a", text: "#ffffff" },
  chordSelected: { fill: "#7dd3fc", border: "#ffffff", text: "#082f49" },
  note: { fill: "#16a34a", border: "#052e16", text: "#ffffff" },
  noteSelected: { fill: "#bef264", border: "#ffffff", text: "#1a2e05" },
};

// notes of a song with several tracks take the colour of their track. The first track keeps the green
const TRACK_NOTE_COLORS = [
  NOTE_COLORS.note,
  { fill: "#ea580c", border: "#431407", text: "#ffffff" },
  { fill: "#9333ea", border: "#3b0764", text: "#ffffff" },
  { fill: "#db2777", border: "#500724", text: "#ffffff" },
  { fill: "#0891b2", border: "#083344", text: "#ffffff" },
  { fill: "#ca8a04", border: "#422006", text: "#ffffff" },
];

const INACTIVE_TRACK_ALPHA = 0.3;
const MIN_VELOCITY_ALPHA = 0.25;

export const getTrackColor = (index: number) =>
  TRACK_NOTE_COLORS[index % TRACK_NOTE_COLORS.length].fill;

export interface PianoRollScene {
  zoom: Zoom;
  width: number;
  height: number;
  snapTicks: number;
  scalePattern: Set<Note>;
  // the keys outside the scale grey out while new notes snap to it
  snapToScale: boolean;
  baseNote: Note;
  events: { tick: number; event: ChordOrNote }[];
  // notes of the tracks not being edited. They show dimmed, and pressing one edits its track
  inactiveEvents: { tick: number; event: ChordOrNote }[];
  // the colour slot of each track. Undefined paints every note green
  trackColors: Map<number, number> | undefined;
  selection: ReadonlySet<string>;
  preview: Preview | undefined;
  loopLengthTicks: number | undefined;
  // the melody range picked on the ruler, end exclusive
  loopRange: { start: number; end: number } | undefined;
  pressedPitch: number | undefined;
}

export interface Viewport {
  scrollLeft: number;
  scrollTop: number;
  width: number;
  height: number;
}

interface Block {
  tick: number;
  event: ChordOrNote;
  pitch: number;
  selected: boolean;
  ghost: boolean;
  inactive: boolean;
}

const rowColor = (note: Note, scalePattern: Set<Note>, baseNote: Note) => {
  if (!scalePattern.has(note)) {
    return ROW_OUT_OF_SCALE;
  }
  if (note === baseNote) {
    return ROW_ROOT;
  }
  return isSharp(note) ? ROW_IN_SCALE_SHARP : ROW_IN_SCALE;
};

const blockWidth = (event: ChordOrNote, zoom: Zoom) =>
  Math.max(2, getEventDuration(event) * zoom.pixelsPerTick);

/**
 * The note or resize edge under a point in grid px. Selected notes sit on top.
 */
export const hitTestNote = (
  events: { tick: number; event: ChordOrNote }[],
  selection: ReadonlySet<string>,
  zoom: Zoom,
  x: number,
  y: number
): { id: string; edge: ResizeEdge | undefined } | undefined => {
  const test = (selected: boolean) => {
    for (let i = events.length - 1; i >= 0; i--) {
      const { tick, event } = events[i];
      if (selection.has(event.id) !== selected) {
        continue;
      }
      const left = tickToX(tick, zoom);
      const top = pitchToY(getEventPitch(event), zoom);
      const width = blockWidth(event, zoom);
      if (x < left || x >= left + width || y < top || y >= top + zoom.noteHeight) {
        continue;
      }
      const endHandle = Math.min(RESIZE_HANDLE_PX, width / 2);
      let edge: ResizeEdge | undefined;
      if (x >= left + width - endHandle) {
        edge = "end";
      } else if (width >= RESIZE_HANDLE_PX * 3 && x < left + RESIZE_HANDLE_PX) {
        edge = "start";
      }
      return { id: event.id, edge };
    }
    return undefined;
  };
  return test(true) ?? test(false);
};

const collectBlocks = ({
  events,
  inactiveEvents,
  selection,
  preview,
}: PianoRollScene) => {
  const inactive: Block[] = inactiveEvents.map(({ tick, event }) => ({
    tick,
    event,
    pitch: getEventPitch(event),
    selected: false,
    ghost: false,
    inactive: true,
  }));
  const blocks: Block[] = [];
  const ghosts: Block[] = [];
  for (const { tick, event } of events) {
    const selected = selection.has(event.id);
    const pitch = getEventPitch(event);
    if (preview?.kind === "erase" && preview.ids.has(event.id)) {
      continue;
    }
    if (preview?.kind === "move") {
      const target = preview.targets.get(event.id);
      if (target) {
        if (preview.copy) {
          blocks.push({ tick, event, pitch, selected: false, ghost: false, inactive: false });
          ghosts.push({ ...target, event, selected: true, ghost: true, inactive: false });
        } else {
          blocks.push({ ...target, event, selected, ghost: false, inactive: false });
        }
        continue;
      }
    }
    if (preview?.kind === "resize") {
      const target = preview.targets.get(event.id);
      if (target) {
        blocks.push({
          tick: target.tick,
          event: { ...event, duration: target.duration },
          pitch,
          selected,
          ghost: false,
          inactive: false,
        });
        continue;
      }
    }
    blocks.push({ tick, event, pitch, selected, ghost: false, inactive: false });
  }
  if (preview?.kind === "draw") {
    ghosts.push({
      tick: preview.tick,
      event: preview.event,
      pitch: getEventPitch(preview.event),
      selected: true,
      ghost: true,
      inactive: false,
    });
  }
  // the dimmed tracks sit under the one being edited, selected notes over the rest
  return [
    ...inactive,
    ...blocks.filter(({ selected }) => !selected),
    ...blocks.filter(({ selected }) => selected),
    ...ghosts,
  ];
};

const drawVerticalLines = (
  ctx: CanvasRenderingContext2D,
  color: string,
  spacing: number,
  from: number,
  to: number,
  top: number,
  height: number
) => {
  ctx.fillStyle = color;
  for (let x = Math.floor(from / spacing) * spacing; x < to; x += spacing) {
    ctx.fillRect(x, top, 1, height);
  }
};

const drawGrid = (
  ctx: CanvasRenderingContext2D,
  scene: PianoRollScene,
  left: number,
  right: number,
  top: number,
  bottom: number
) => {
  const { zoom, scalePattern, baseNote, snapTicks } = scene;
  const h = zoom.noteHeight;
  const firstRow = Math.max(0, Math.floor(top / h));
  const lastRow = Math.min(PITCH_COUNT - 1, Math.ceil(bottom / h));
  for (let row = firstRow; row <= lastRow; row++) {
    const pitch = PITCH_COUNT - 1 - row;
    ctx.fillStyle = rowColor(pitch % NOTE_COUNT, scalePattern, baseNote);
    ctx.fillRect(left, row * h, right - left, h - 1);
    ctx.fillStyle = ROW_LINE;
    ctx.fillRect(left, (row + 1) * h - 1, right - left, 1);
  }

  const beatWidth = TICKS_IN_BEAT * zoom.pixelsPerTick;
  const snapWidth = snapTicks * zoom.pixelsPerTick;
  const height = bottom - top;
  if (snapWidth >= MIN_LINE_SPACING_PX && snapWidth < beatWidth) {
    drawVerticalLines(ctx, SNAP_LINE, snapWidth, left, right, top, height);
  }
  if (beatWidth >= MIN_LINE_SPACING_PX) {
    drawVerticalLines(ctx, BEAT_LINE, beatWidth, left, right, top, height);
  }
  drawVerticalLines(ctx, BAR_LINE, beatWidth * BEATS_IN_BAR, left, right, top, height);
};

const drawBlock = (
  ctx: CanvasRenderingContext2D,
  { tick, event, pitch, selected, ghost, inactive }: Block,
  zoom: Zoom,
  trackColors: Map<number, number> | undefined
) => {
  const x = tickToX(tick, zoom);
  const y = pitchToY(pitch, zoom);
  const width = blockWidth(event, zoom);
  const height = zoom.noteHeight;
  const isChord = isChordEvent(event);
  const trackColor = trackColors?.get(getEventTrack(event));
  const colors = isChord
    ? selected
      ? NOTE_COLORS.chordSelected
      : NOTE_COLORS.chord
    : selected
      ? NOTE_COLORS.noteSelected
      : TRACK_NOTE_COLORS[(trackColor ?? 0) % TRACK_NOTE_COLORS.length];

  ctx.save();
  ctx.globalAlpha = inactive ? INACTIVE_TRACK_ALPHA : ghost ? 0.6 : 1;
  if (selected) {
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x - 0.5, y - 0.5, width + 1, height + 1, 4);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 3);
  ctx.fillStyle = colors.fill;
  // a quieter note shows paler
  const velocity = event.note?.velocity;
  const opacity = ctx.globalAlpha;
  if (velocity !== undefined) {
    ctx.globalAlpha =
      opacity * (MIN_VELOCITY_ALPHA + (1 - MIN_VELOCITY_ALPHA) * (velocity / MAX_VOLUME));
  }
  ctx.fill();
  ctx.globalAlpha = opacity;
  ctx.beginPath();
  ctx.roundRect(x + 0.5, y + 0.5, width - 1, height - 1, 2.5);
  ctx.strokeStyle = colors.border;
  ctx.stroke();

  if (!ghost && !inactive && !isChordModeAvailable(event)) {
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 1, y - 1, width + 2, height + 2);
    ctx.setLineDash([]);
  }

  if (width >= MIN_LABEL_WIDTH_PX && height >= 10) {
    const label =
      pitch === getEventPitch(event)
        ? getChordOrNoteText(event)
        : getChordOrNoteText(withPitch(event, pitch)?.event ?? event);
    ctx.beginPath();
    ctx.rect(x + 1, y, width - 2, height);
    ctx.clip();
    ctx.fillStyle = colors.text;
    ctx.font = `${Math.min(11, height - 4)}px ${LABEL_FONT_FAMILY}`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(label, x + 5, y + height / 2);
  }
  ctx.restore();
};

const drawNoteArea = (
  ctx: CanvasRenderingContext2D,
  scene: PianoRollScene,
  viewport: Viewport
) => {
  const { zoom, width, height, preview, loopLengthTicks, loopRange } = scene;
  const left = Math.max(0, viewport.scrollLeft);
  const top = Math.max(0, viewport.scrollTop);
  const right = Math.min(width, viewport.scrollLeft + viewport.width - PITCH_AXIS_WIDTH);
  const bottom = Math.min(height, viewport.scrollTop + viewport.height - TIMELINE_HEIGHT);

  drawGrid(ctx, scene, left, right, top, bottom);

  for (const block of collectBlocks(scene)) {
    const x = tickToX(block.tick, zoom);
    const y = pitchToY(block.pitch, zoom);
    if (
      x > right ||
      x + blockWidth(block.event, zoom) < left ||
      y > bottom ||
      y + zoom.noteHeight < top
    ) {
      continue;
    }
    drawBlock(ctx, block, zoom, scene.trackColors);
  }

  if (preview?.kind === "rubber") {
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(preview.x, preview.y, preview.width, preview.height);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.strokeRect(
      preview.x + 0.5,
      preview.y + 0.5,
      Math.max(0, preview.width - 1),
      Math.max(0, preview.height - 1)
    );
  }

  if (loopRange) {
    const startX = tickToX(loopRange.start, zoom);
    const endX = tickToX(loopRange.end, zoom);
    ctx.fillStyle = "rgba(34,211,238,0.07)";
    ctx.fillRect(startX, 0, endX - startX, height);
    ctx.fillStyle = LOOP_RANGE;
    ctx.fillRect(startX, 0, 1, height);
    ctx.fillRect(endX - 1, 0, 1, height);
  }

  if (loopLengthTicks !== undefined) {
    // notes past the loop end don't play
    const loopX = tickToX(loopLengthTicks, zoom);
    if (loopX < width) {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(loopX, 0, width - loopX, height);
      ctx.fillStyle = LOOP_END;
      ctx.fillRect(loopX, 0, 2, height);
    }
  }
};

const drawTimeline = (
  ctx: CanvasRenderingContext2D,
  { zoom, width, loopRange }: PianoRollScene,
  viewport: Viewport
) => {
  const left = Math.max(0, viewport.scrollLeft);
  const right = Math.min(width, viewport.scrollLeft + viewport.width - PITCH_AXIS_WIDTH);
  const bottom = TIMELINE_HEIGHT - 1;
  ctx.fillStyle = "#e5e7eb";
  ctx.fillRect(left, 0, right - left, TIMELINE_HEIGHT);
  if (loopRange) {
    const startX = tickToX(loopRange.start, zoom);
    ctx.fillStyle = "rgba(34,211,238,0.55)";
    ctx.fillRect(startX, 0, tickToX(loopRange.end, zoom) - startX, bottom);
  }
  ctx.fillStyle = "#9ca3af";
  ctx.fillRect(left, bottom, right - left, 1);

  const beatWidth = TICKS_IN_BEAT * zoom.pixelsPerTick;
  if (beatWidth >= MIN_LINE_SPACING_PX) {
    const tickHeight = TIMELINE_HEIGHT / 3;
    drawVerticalLines(ctx, "#9ca3af", beatWidth, left, right, bottom - tickHeight, tickHeight);
  }

  const barWidth = TICKS_IN_BAR * zoom.pixelsPerTick;
  // zoomed out, only every 2nd, 4th, 8th bar gets a number
  let labelEvery = 1;
  while (barWidth * labelEvery < MIN_BAR_LABEL_SPACING_PX) {
    labelEvery *= 2;
  }
  const step = barWidth * labelEvery;
  ctx.font = `11px ${LABEL_FONT_FAMILY}`;
  ctx.textBaseline = "bottom";
  ctx.textAlign = "left";
  // a label starting left of the view can still show its tail
  const firstBar = Math.max(0, Math.floor((left - MIN_BAR_LABEL_SPACING_PX) / step)) * labelEvery;
  for (let bar = firstBar; bar * barWidth < right; bar += labelEvery) {
    const x = bar * barWidth;
    ctx.fillStyle = "#4b5563";
    ctx.fillRect(x, 0, 1, bottom);
    ctx.fillStyle = "#374151";
    ctx.fillText(String(bar + 1), x + 5, bottom - 1);
  }
};

const drawPitchAxis = (
  ctx: CanvasRenderingContext2D,
  { zoom, baseNote, scalePattern, snapToScale, pressedPitch }: PianoRollScene,
  viewport: Viewport
) => {
  const h = zoom.noteHeight;
  const top = Math.max(0, viewport.scrollTop);
  const bottom = Math.min(PITCH_COUNT * h, viewport.scrollTop + viewport.height - TIMELINE_HEIGHT);
  ctx.fillStyle = KEY_WHITE;
  ctx.fillRect(0, top, PITCH_AXIS_WIDTH, bottom - top);
  ctx.strokeStyle = "#D1D5DB";
  ctx.lineWidth = 1;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";

  const highest = PITCH_COUNT - 1 - Math.max(0, Math.floor(top / h));
  const lowest = PITCH_COUNT - 1 - Math.min(PITCH_COUNT - 1, Math.floor(bottom / h));
  for (let pitch = lowest; pitch <= highest; pitch++) {
    const y = pitchToY(pitch, zoom);
    const octaveNote = fromPitch(pitch);
    const sharp = isSharp(octaveNote.note);
    const lit = pressedPitch === pitch;
    const inScale = !snapToScale || scalePattern.has(octaveNote.note);

    if (sharp) {
      ctx.fillStyle = lit ? "#1e3a8a" : inScale ? KEY_BLACK : KEY_BLACK_OUT_OF_SCALE;
      ctx.fillRect(0, y, BLACK_KEY_WIDTH, h);
    } else {
      if (lit || !inScale) {
        ctx.fillStyle = lit ? "#bfdbfe" : KEY_WHITE_OUT_OF_SCALE;
        ctx.fillRect(0, y, PITCH_AXIS_WIDTH, h);
      }
      // a white key edge only where two white keys meet
      if (!isSharp(fromPitch(pitch + 1).note)) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(PITCH_AXIS_WIDTH, y + 0.5);
        ctx.stroke();
      }
    }

    if (h >= 10) {
      const isBaseNote = octaveNote.note === baseNote;
      ctx.fillStyle = sharp
        ? inScale
          ? KEY_LABEL_BLACK
          : KEY_LABEL_BLACK_OUT_OF_SCALE
        : isBaseNote
          ? KEY_BLACK
          : inScale
            ? KEY_LABEL_WHITE
            : KEY_LABEL_OUT_OF_SCALE;
      ctx.font = `${isBaseNote ? "bold " : ""}${Math.min(11, h - 4)}px Arial`;
      ctx.fillText(serializeOctaveNote(octaveNote), sharp ? 4 : BLACK_KEY_WIDTH + 6, y + h / 2);
    }
  }
};

/**
 * The key under a point on the keyboard. The right part of a black key row belongs to the white key next to it.
 */
export const pitchAtAxisPoint = (zoom: Zoom, x: number, y: number) => {
  const rowPitch = PITCH_COUNT - 1 - Math.floor(y / zoom.noteHeight);
  if (isSharp(fromPitch(rowPitch).note) && x > BLACK_KEY_WIDTH) {
    const inUpperHalf = y % zoom.noteHeight < zoom.noteHeight / 2;
    return inUpperHalf ? rowPitch + 1 : rowPitch - 1;
  }
  return rowPitch;
};

const clipRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
};

export const drawScene = (
  ctx: CanvasRenderingContext2D,
  scene: PianoRollScene,
  viewport: Viewport
) => {
  const { scrollLeft, scrollTop, width, height } = viewport;
  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  clipRect(ctx, PITCH_AXIS_WIDTH, TIMELINE_HEIGHT, width, height);
  ctx.translate(PITCH_AXIS_WIDTH - scrollLeft, TIMELINE_HEIGHT - scrollTop);
  drawNoteArea(ctx, scene, viewport);
  ctx.restore();

  ctx.save();
  clipRect(ctx, PITCH_AXIS_WIDTH, 0, width, TIMELINE_HEIGHT);
  ctx.translate(PITCH_AXIS_WIDTH - scrollLeft, 0);
  drawTimeline(ctx, scene, viewport);
  ctx.restore();

  ctx.save();
  clipRect(ctx, 0, TIMELINE_HEIGHT, PITCH_AXIS_WIDTH, height);
  ctx.translate(0, TIMELINE_HEIGHT - scrollTop);
  drawPitchAxis(ctx, scene, viewport);
  ctx.restore();

  ctx.fillStyle = "#d1d5db";
  ctx.fillRect(0, 0, PITCH_AXIS_WIDTH, TIMELINE_HEIGHT);
  ctx.fillStyle = "#9ca3af";
  ctx.fillRect(0, TIMELINE_HEIGHT - 1, PITCH_AXIS_WIDTH, 1);
  ctx.fillRect(PITCH_AXIS_WIDTH - 1, 0, 1, TIMELINE_HEIGHT);
};

export const drawPlayhead = (
  ctx: CanvasRenderingContext2D,
  tick: number,
  zoom: Zoom,
  viewport: Viewport
) => {
  const x = PITCH_AXIS_WIDTH + tickToX(tick, zoom) - viewport.scrollLeft;
  if (x < PITCH_AXIS_WIDTH - 6 || x > viewport.width + 6) {
    return;
  }
  ctx.save();
  clipRect(ctx, PITCH_AXIS_WIDTH, 0, viewport.width, viewport.height);
  ctx.fillStyle = PLAYHEAD;
  ctx.fillRect(x, TIMELINE_HEIGHT, 1, viewport.height - TIMELINE_HEIGHT);
  const bottom = TIMELINE_HEIGHT - 1;
  ctx.beginPath();
  ctx.moveTo(x - 6, bottom - 9);
  ctx.lineTo(x + 6, bottom - 9);
  ctx.lineTo(x, bottom);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};
