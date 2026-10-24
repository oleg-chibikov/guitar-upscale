import { findClosestCell } from "@/app/engine/chords/chordButtonHitAreas";
import {
  getNativeContext,
  useSafePixelRatio,
} from "@/app/helpers/canvas/konvaHelpers";
import {
  BUTTON_FONT_FAMILY,
  BUTTON_FONT_STYLE,
  Palette,
  RED_500,
  getPalette,
} from "@/app/helpers/canvas/palette";
import { Note } from "@/app/data/notes";
import { useUiSelector } from "@/app/hooks/storeHooks";
import type Konva from "konva";
import { Animation as KonvaAnimation } from "konva/lib/Animation";
import React, { RefObject, useEffect, useLayoutEffect, useRef } from "react";
import { Layer, Shape, Stage } from "react-konva/lib/ReactKonvaCore";
import { ChordCellState, ChordGridStore, PULSE_MS } from "./chordGridStore";
import { ChordGridCell } from "./chordGridLayout";
import { useChordGridTouch } from "./useChordGridTouch";

const CELL_WIDTH = 64;
export const SMALL_CELL_HEIGHT = 24;
export const LARGE_CELL_HEIGHT = 32;
export const KEY_CELL_HEIGHT = 40;
const GAP = 2;
const BORDER = 2;
const TEXT_PADDING = 2;
const PULSE_SCALE = 0.5;
const FONT = `${BUTTON_FONT_STYLE} 12px ${BUTTON_FONT_FAMILY}`;

// the few chords of the key get bigger, rounder buttons than the full grid
const getGeometry = (cellHeight: number) =>
  cellHeight >= KEY_CELL_HEIGHT
    ? { gap: 4, radius: 8, font: `600 14px ${BUTTON_FONT_FAMILY}` }
    : { gap: GAP, radius: 5, font: FONT };

type Geometry = ReturnType<typeof getGeometry>;

const roundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  ctx.beginPath();
  // older Safari has no roundRect
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    ctx.rect(x, y, width, height);
  }
};

interface ChordGridProps {
  layout: ChordGridCell[];
  cellHeight: number;
  store: ChordGridStore;
  // the element that scrolls the grid. Presses snap only to buttons inside it
  scrollerRef: RefObject<HTMLElement | null>;
  hasTouchInput: boolean;
  // the bass note picked in the Bass note strip
  bassNote?: Note;
}

interface Cell {
  chordName: string;
  label: string;
  x: number;
  y: number;
  isDisabled: boolean;
}

const easeInOut = (progress: number) =>
  progress < 0.5
    ? 2 * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 2) / 2;

const getPulseScale = (startedAt: number | undefined, now: number) => {
  if (startedAt === undefined || now - startedAt >= PULSE_MS) {
    return 1;
  }
  const progress = (now - startedAt) / PULSE_MS;
  // shrinks for the first half, grows back for the second
  return progress < 0.5
    ? 1 - (1 - PULSE_SCALE) * easeInOut(progress * 2)
    : PULSE_SCALE + (1 - PULSE_SCALE) * easeInOut(progress * 2 - 1);
};

const getFill = (
  palette: Palette,
  state: ChordCellState,
  isDisabled: boolean,
) => {
  if (isDisabled) {
    return palette.disabled;
  }
  if (state.isClicked) {
    return palette.buttonPressed;
  }
  return state.wasPlayedLast ? palette.secondary : palette.button;
};

const getBorder = (palette: Palette, state: ChordCellState) => {
  if (state.isInImmediateChordGracePeriod) {
    return RED_500;
  }
  if (state.isGracePeriod) {
    return palette.accentStronger;
  }
  if (state.isPlaying) {
    return palette.accentStrongest;
  }
  return state.isClicked ? palette.accent : undefined;
};

const getCursor = (state: ChordCellState, isDisabled: boolean) => {
  if (state.isClicked && !state.isPlaying) {
    return "progress";
  }
  return state.isPlaying || (!isDisabled && !state.isClicked) ? "pointer" : "";
};

// measuring text is slow, and the grid redraws its labels on every pulse frame
const fittedTexts = new Map<string, string>();

const fitText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
) => {
  const key = `${ctx.font}|${width}|${text}`;
  const cached = fittedTexts.get(key);
  if (cached !== undefined) {
    return cached;
  }
  let fitted = text;
  if (ctx.measureText(text).width > width) {
    while (fitted.length > 1 && ctx.measureText(fitted + "…").width > width) {
      fitted = fitted.slice(0, -1);
    }
    fitted += "…";
  }
  fittedTexts.set(key, fitted);
  return fitted;
};

const drawCell = (
  ctx: CanvasRenderingContext2D,
  { label, x, y, isDisabled }: Cell,
  cellHeight: number,
  geometry: Geometry,
  palette: Palette,
  state: ChordCellState,
  scale: number,
) => {
  ctx.save();
  if (scale !== 1) {
    ctx.translate(x + CELL_WIDTH / 2, y + cellHeight / 2);
    ctx.scale(scale, scale);
    ctx.translate(-x - CELL_WIDTH / 2, -y - cellHeight / 2);
  }
  ctx.fillStyle = getFill(palette, state, isDisabled);
  roundedRect(ctx, x, y, CELL_WIDTH, cellHeight, geometry.radius);
  ctx.fill();

  const border = isDisabled ? undefined : getBorder(palette, state);
  if (border !== undefined) {
    ctx.strokeStyle = border;
    ctx.lineWidth = BORDER;
    roundedRect(
      ctx,
      x + BORDER / 2,
      y + BORDER / 2,
      CELL_WIDTH - BORDER,
      cellHeight - BORDER,
      geometry.radius,
    );
    ctx.stroke();
  }

  ctx.fillStyle = isDisabled ? palette.disabledForeground : palette.foreground;
  ctx.fillText(
    fitText(ctx, label, CELL_WIDTH - 2 * TEXT_PADDING),
    x + CELL_WIDTH / 2,
    y + cellHeight / 2,
  );
  ctx.restore();
};

/**
 * Draws the grid. A partial draw repaints only the cells that pulse now or pulsed on the last draw.
 * Returns the cells drawn shrunk, which the next partial draw repaints.
 */
const drawCells = (
  ctx: CanvasRenderingContext2D,
  cells: Cell[],
  cellHeight: number,
  geometry: Geometry,
  palette: Palette,
  store: ChordGridStore,
  now: number,
  pulsedOnLastDraw: ReadonlySet<number> | undefined,
) => {
  ctx.font = geometry.font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const pulsing = new Set<number>();
  cells.forEach((cell, index) => {
    const state = store.get(cell.chordName);
    const scale = getPulseScale(state.pulseStartedAt, now);
    if (scale !== 1) {
      pulsing.add(index);
    }
    if (pulsedOnLastDraw) {
      if (scale === 1 && !pulsedOnLastDraw.has(index)) {
        return;
      }
      // the gap around a cell is empty, so clearing into it is safe
      ctx.clearRect(cell.x - 1, cell.y - 1, CELL_WIDTH + 2, cellHeight + 2);
    }
    drawCell(ctx, cell, cellHeight, geometry, palette, state, scale);
  });
  return pulsing;
};

/**
 * The chord buttons, drawn on one canvas. A press plays the closest playable chord.
 */
export const ChordGrid: React.FC<ChordGridProps> = ({
  layout,
  cellHeight,
  store,
  scrollerRef,
  hasTouchInput,
  bassNote,
}) => {
  const theme = useUiSelector((s) => s.theme);
  const containerRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<Konva.Layer>(null);

  const geometry = getGeometry(cellHeight);
  const step = CELL_WIDTH + geometry.gap;
  const columnCount = Math.max(0, ...layout.map((c) => c.column + 1));
  const rowCount = Math.max(0, ...layout.map((c) => c.row + 1));
  const width = Math.max(0, columnCount * step - geometry.gap);
  const height = Math.max(
    0,
    rowCount * (cellHeight + geometry.gap) - geometry.gap,
  );

  const cells: Cell[] = layout.map(
    ({ chordName, root, column, row, isDisabled }) => ({
      chordName,
      label:
        bassNote === undefined || bassNote === root || isDisabled
          ? chordName
          : `${chordName}/${Note[bassNote]}`,
      x: column * step,
      y: row * (cellHeight + geometry.gap),
      isDisabled,
    }),
  );

  const drawRef = useRef<(context: Konva.Context) => void>(() => {});
  // a pulse frame repaints only the pulsing cells. Any other change repaints the whole grid
  const needsFullDraw = useRef(true);
  useLayoutEffect(() => {
    const palette = getPalette(theme);
    let pulsedOnLastDraw: ReadonlySet<number> = new Set();
    let drawnBitmap = "";
    drawRef.current = (context) => {
      const canvas = context.getCanvas();
      // resizing the canvas or changing its pixel ratio wipes it
      const bitmap = `${canvas.width}x${canvas.height}`;
      const full = needsFullDraw.current || bitmap !== drawnBitmap;
      needsFullDraw.current = false;
      drawnBitmap = bitmap;
      if (full) {
        context.clear();
      }
      pulsedOnLastDraw = drawCells(
        getNativeContext(context),
        cells,
        cellHeight,
        geometry,
        palette,
        store,
        performance.now(),
        full ? undefined : pulsedOnLastDraw,
      );
    };
    needsFullDraw.current = true;
    layerRef.current?.batchDraw();
  });

  useSafePixelRatio([layerRef], width, height);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) {
      return;
    }
    const animation = new KonvaAnimation(() => {
      if (!store.isAnimating(performance.now())) {
        animation.stop();
      }
    }, layer);
    store.onChange(() => {
      needsFullDraw.current = true;
      layer.batchDraw();
      if (!animation.isRunning() && store.isAnimating(performance.now())) {
        animation.start();
      }
    });
    return () => {
      animation.stop();
      store.onChange(undefined);
    };
  }, [store]);

  const toLocal = (clientX: number, clientY: number) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const findChord = (clientX: number, clientY: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return undefined;
    }
    const { x, y } = toLocal(clientX, clientY);
    const scrollerRect = scroller.getBoundingClientRect();
    const origin = containerRef.current!.getBoundingClientRect();
    const viewport = {
      left: scrollerRect.left - origin.left,
      top: scrollerRect.top - origin.top,
      right: scrollerRect.right - origin.left,
      bottom: scrollerRect.bottom - origin.top,
    };
    const playable = cells.flatMap((cell) => {
      return store.canPress(cell.chordName)
        ? [
            {
              rect: {
                left: cell.x,
                top: cell.y,
                right: cell.x + CELL_WIDTH,
                bottom: cell.y + cellHeight,
              },
              value: cell.chordName,
            },
          ]
        : [];
    });
    return findClosestCell(playable, x, y, viewport);
  };

  const touchHandlers = useChordGridTouch(store, scrollerRef, findChord);

  const handleHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const { x, y } = toLocal(e.clientX, e.clientY);
    const cell = cells.find(
      (cell) =>
        x >= cell.x &&
        x < cell.x + CELL_WIDTH &&
        y >= cell.y &&
        y < cell.y + cellHeight,
    );
    e.currentTarget.style.cursor = cell
      ? getCursor(store.get(cell.chordName), cell.isDisabled)
      : "";
  };

  return (
    <div
      ref={containerRef}
      style={{ width, height }}
      {...(hasTouchInput ? touchHandlers : {})}
      onMouseDownCapture={
        hasTouchInput
          ? undefined
          : (e) => {
              const chordName = findChord(e.clientX, e.clientY);
              if (chordName !== undefined) {
                store.press(chordName);
              }
            }
      }
      onMouseMove={hasTouchInput ? undefined : handleHover}
    >
      <Stage width={width} height={height} listening={false}>
        <Layer ref={layerRef} listening={false} clearBeforeDraw={false}>
          <Shape sceneFunc={(context) => drawRef.current(context)} />
        </Layer>
      </Stage>
    </div>
  );
};
