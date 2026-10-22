import { ChordModeVariations, getChordName } from "@/app/data/chordModes";
import { Note } from "@/app/data/notes";
import { findClosestCell } from "@/app/engine/chords/chordButtonHitAreas";
import {
  getNativeContext,
  useSafePixelRatio,
} from "@/app/helpers/canvas/konvaHelpers";
import {
  BUTTON_FONT_FAMILY,
  BUTTON_FONT_STYLE,
  GRAY_500,
  Palette,
  RED_500,
  getPalette,
} from "@/app/helpers/canvas/palette";
import { useUiSelector } from "@/app/hooks/storeHooks";
import Konva from "konva";
import React, { RefObject, useEffect, useLayoutEffect, useRef } from "react";
import { Layer, Shape, Stage } from "react-konva";
import { ChordCellState, ChordGridStore, PULSE_MS } from "./chordGridStore";

const CELL_WIDTH = 64;
const SMALL_CELL_HEIGHT = 24;
const LARGE_CELL_HEIGHT = 32;
const GAP = 2;
const BORDER = 2;
const TEXT_PADDING = 2;
const PULSE_SCALE = 0.5;
const FONT = `${BUTTON_FONT_STYLE} 12px ${BUTTON_FONT_FAMILY}`;

interface ChordGridProps {
  columns: ChordModeVariations[];
  notes: Note[];
  store: ChordGridStore;
  // the element that scrolls the grid. Presses snap only to buttons inside it
  scrollerRef: RefObject<HTMLElement | null>;
  hasTouchInput: boolean;
}

interface Cell {
  chordName: string;
  x: number;
  y: number;
  isDisabled: boolean;
}

const easeInOut = (progress: number) =>
  progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

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

const getFill = (palette: Palette, state: ChordCellState, isDisabled: boolean) => {
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

const fitText = (ctx: CanvasRenderingContext2D, text: string, width: number) => {
  if (ctx.measureText(text).width <= width) {
    return text;
  }
  let fitted = text;
  while (fitted.length > 1 && ctx.measureText(fitted + "…").width > width) {
    fitted = fitted.slice(0, -1);
  }
  return fitted + "…";
};

const drawCells = (
  ctx: CanvasRenderingContext2D,
  cells: Cell[],
  cellHeight: number,
  palette: Palette,
  store: ChordGridStore,
  now: number
) => {
  ctx.font = FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const { chordName, x, y, isDisabled } of cells) {
    const state = store.get(chordName);
    const scale = getPulseScale(state.pulseStartedAt, now);
    ctx.save();
    if (scale !== 1) {
      ctx.translate(x + CELL_WIDTH / 2, y + cellHeight / 2);
      ctx.scale(scale, scale);
      ctx.translate(-x - CELL_WIDTH / 2, -y - cellHeight / 2);
    }
    ctx.fillStyle = getFill(palette, state, isDisabled);
    ctx.fillRect(x, y, CELL_WIDTH, cellHeight);

    const border = isDisabled ? undefined : getBorder(palette, state);
    if (border !== undefined) {
      ctx.strokeStyle = border;
      ctx.lineWidth = BORDER;
      ctx.strokeRect(
        x + BORDER / 2,
        y + BORDER / 2,
        CELL_WIDTH - BORDER,
        cellHeight - BORDER
      );
    }

    ctx.fillStyle = isDisabled ? GRAY_500 : palette.foreground;
    ctx.fillText(
      fitText(ctx, chordName, CELL_WIDTH - 2 * TEXT_PADDING),
      x + CELL_WIDTH / 2,
      y + cellHeight / 2
    );
    ctx.restore();
  }
};

/**
 * The chord buttons, drawn on one canvas. A press plays the closest playable chord.
 */
export const ChordGrid: React.FC<ChordGridProps> = ({
  columns,
  notes,
  store,
  scrollerRef,
  hasTouchInput,
}) => {
  const theme = useUiSelector((s) => s.theme);
  const useSharpChords = useUiSelector((s) => s.useSharpChords);
  const cellHeight = useSharpChords ? SMALL_CELL_HEIGHT : LARGE_CELL_HEIGHT;
  const containerRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<Konva.Layer>(null);

  const width = columns.length * (CELL_WIDTH + GAP) - GAP;
  const height = notes.length * (cellHeight + GAP) - GAP;

  const cells: Cell[] = [];
  notes.forEach((note, row) => {
    columns.forEach(({ chordMode, variationsByNote }, column) => {
      cells.push({
        chordName: getChordName(note, chordMode),
        x: column * (CELL_WIDTH + GAP),
        y: row * (cellHeight + GAP),
        isDisabled: !(variationsByNote[note]?.length ?? 0),
      });
    });
  });

  const drawRef = useRef<(ctx: CanvasRenderingContext2D) => void>(() => {});
  useLayoutEffect(() => {
    const palette = getPalette(theme);
    drawRef.current = (ctx) =>
      drawCells(ctx, cells, cellHeight, palette, store, performance.now());
    layerRef.current?.batchDraw();
  });

  useSafePixelRatio([layerRef], width, height);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) {
      return;
    }
    const animation = new Konva.Animation(() => {
      if (!store.isAnimating(performance.now())) {
        animation.stop();
      }
    }, layer);
    store.onChange(() => {
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

  const findPressHandler = (clientX: number, clientY: number) => {
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
      const onPress = store.getPressHandler(cell.chordName);
      return onPress
        ? [
            {
              rect: {
                left: cell.x,
                top: cell.y,
                right: cell.x + CELL_WIDTH,
                bottom: cell.y + cellHeight,
              },
              value: onPress,
            },
          ]
        : [];
    });
    return findClosestCell(playable, x, y, viewport);
  };

  const handleHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const { x, y } = toLocal(e.clientX, e.clientY);
    const cell = cells.find(
      (cell) =>
        x >= cell.x &&
        x < cell.x + CELL_WIDTH &&
        y >= cell.y &&
        y < cell.y + cellHeight
    );
    e.currentTarget.style.cursor = cell
      ? getCursor(store.get(cell.chordName), cell.isDisabled)
      : "";
  };

  return (
    <div
      ref={containerRef}
      style={{ width, height }}
      onTouchStartCapture={
        hasTouchInput
          ? (e) => {
              for (const touch of Array.from(e.changedTouches)) {
                void findPressHandler(touch.clientX, touch.clientY)?.();
              }
            }
          : undefined
      }
      onMouseDownCapture={
        hasTouchInput
          ? undefined
          : (e) => void findPressHandler(e.clientX, e.clientY)?.()
      }
      onMouseMove={hasTouchInput ? undefined : handleHover}
    >
      <Stage width={width} height={height} listening={false}>
        <Layer ref={layerRef} listening={false}>
          <Shape
            sceneFunc={(context) => drawRef.current(getNativeContext(context))}
          />
        </Layer>
      </Stage>
    </div>
  );
};
