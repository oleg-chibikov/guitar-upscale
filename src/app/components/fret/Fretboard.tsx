import { MIN_HEIGHT_TO_SHOW_LARGE_CHORDS } from "@/app/data/chordsDisplayMode";
import { FRETBOARD } from "@/app/data/elementIds";
import { NoteDisplayMode } from "@/app/data/noteDisplayMode";
import {
  FRET_COUNT,
  NOTE_COUNT,
  StringOctaveNote,
  serializeOctaveNote,
} from "@/app/data/notes";
import { getShiftedNote } from "@/app/data/tunings";
import { currentTick } from "@/app/engine/clock/mainClock";
import { NotePlayEventBus } from "@/app/engine/eventBus";
import {
  BUTTON_FONT_FAMILY,
  BUTTON_FONT_STYLE,
  Palette,
  RED_500,
  getPalette,
  mixColors,
} from "@/app/helpers/canvas/palette";
import {
  getNativeContext,
  useSafePixelRatio,
} from "@/app/helpers/canvas/konvaHelpers";
import { trailingDebounce } from "@/app/helpers/debounce";
import { interpolate } from "@/app/helpers/interpolation";
import { NO_LONG_PRESS_ATTRIBUTE } from "@/app/helpers/longPressBlocker";
import {
  getAssetsForSkin,
  getParametersForSkin,
  getPositionForSkin,
} from "@/app/helpers/skinHelper";
import { sleep } from "@/app/helpers/sleep";
import { useSettingsSelector, useUiSelector } from "@/app/hooks/storeHooks";
import { useInputChecker } from "@/app/hooks/useInputChecker";
import {
  capoValue,
  chordStrummingDelayMsValue,
  tuningValue,
} from "@/app/store/settingsSlice";
import Konva from "konva";
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Group, Image as KonvaImage, Layer, Shape, Stage } from "react-konva";
import {
  FRET_LINE_HEIGHT,
  FRET_LINE_WIDTH,
  FretboardLayout,
  HEADER_CELL_HEIGHT,
  MARKER_RADIUS,
  findFretHit,
  getFretboardLayout,
} from "./fretboardLayout";
import {
  BLAST_ANIMATION_MS,
  FretMarkerState,
  FretMarkerStore,
  PRESS_ANIMATION_MS,
} from "./fretMarkerStore";
import { useFretboardPinchZoom } from "./useFretboardPinchZoom";

const ASSETS_URL = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/skins`;
// the photo is scaled down to match the fret positions
const IMAGE_SCALE = 0.662;
const IMAGE_WIDTH = 5504;
const IMAGE_HEIGHT = 2200;

const COLORED_HEADERS = new Set<number>([
  0, 3, 5, 7, 9, 12, 15, 17, 19, 21, 24,
]);
const FONT = `${BUTTON_FONT_STYLE} 12px ${BUTTON_FONT_FAMILY}`;
const BADGE_FONT = `10px ${BUTTON_FONT_FAMILY}`;
const BADGE_RADIUS = 8;
const BLAST_START_RADIUS = 2.5;
const BLAST_MAX_SCALE = 30;
const GLOW_BLUR = 40;
const GLOW_SPREAD = 10;
const DETECTION_BORDER = 4;

const FINGER_NAMES = [
  "Index finger",
  "Middle finger",
  "Ring finger",
  "Pinky",
  "Thumb",
];

interface DrawState {
  layout: FretboardLayout;
  neck: (StringOctaveNote | null)[][];
  palette: Palette;
  scaleX: number;
  scaleY: number;
  originX: number;
  originY: number;
  noteDisplayMode: NoteDisplayMode;
}

const isSameDrawState = (a?: DrawState, b?: DrawState) =>
  a === b ||
  (!!a &&
    !!b &&
    (Object.keys(a) as (keyof DrawState)[]).every((key) => a[key] === b[key]));

const easeOut = (progress: number) => 1 - Math.pow(1 - progress, 2);

const getMarkerText = (
  stringOctaveNote: StringOctaveNote,
  noteDisplayMode: NoteDisplayMode,
) => {
  // the open string shows its note
  const displayMode =
    stringOctaveNote.fret === capoValue
      ? NoteDisplayMode.Note
      : noteDisplayMode;
  switch (displayMode) {
    case NoteDisplayMode.Note:
      return serializeOctaveNote(stringOctaveNote);
    case NoteDisplayMode.Note_Shift: {
      const shift =
        (stringOctaveNote.note - getShiftedNote(capoValue, tuningValue)) %
        NOTE_COUNT;
      return String(shift >= 0 ? shift : shift + NOTE_COUNT);
    }
    default:
      return String(stringOctaveNote.fret);
  }
};

const getCellFill = (palette: Palette, isColored: boolean, fret: number) => {
  const isBehindCapo = fret < capoValue;
  if (isColored) {
    return isBehindCapo ? palette.disabledMatch : palette.fretMarkerMatch;
  }
  return isBehindCapo ? palette.disabled : palette.fretMarker;
};

const drawBoard = (ctx: CanvasRenderingContext2D, state: DrawState) => {
  const { layout, neck, palette, scaleX, scaleY, originX, originY } = state;
  const toX = (x: number) => (originX + x) / scaleX;
  const toY = (y: number) => (originY + y) / scaleY;
  const lineWidth = FRET_LINE_WIDTH / scaleX;
  const shiftedNote = getShiftedNote(capoValue, tuningValue);

  ctx.font = FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const column of layout.columns) {
    const x = toX(column.left);
    const width = column.width / scaleX;
    const headerTop = toY(layout.headerCenterY - HEADER_CELL_HEIGHT / 2);
    const headerHeight = HEADER_CELL_HEIGHT / scaleY;
    // the header row once compared the fret number with the note, kept as it was
    const isColored =
      COLORED_HEADERS.has(column.fret) || column.fret === shiftedNote;
    ctx.fillStyle = getCellFill(palette, isColored, column.fret);
    ctx.fillRect(x, headerTop, width, headerHeight);

    ctx.fillStyle = palette.border;
    if (column.fret > 0) {
      ctx.fillRect(x, headerTop, lineWidth, headerHeight);
      for (let string = 0; string < neck.length; string++) {
        const centerY = layout.getStringCenterY(string, column.fret);
        ctx.fillRect(
          x,
          toY(centerY - FRET_LINE_HEIGHT / 2),
          lineWidth,
          FRET_LINE_HEIGHT / scaleY,
        );
      }
    }

    ctx.fillStyle = palette.foreground;
    ctx.fillText(
      String(column.fret),
      toX(column.centerX),
      toY(layout.headerCenterY),
    );
  }
};

const getMarkerColors = (
  palette: Palette,
  marker: FretMarkerState | undefined,
  isColored: boolean,
  fret: number,
) => {
  const isFromPreviousChord = marker?.isFromPreviousChord === true;
  const fill = isFromPreviousChord
    ? isColored
      ? palette.previousFretMarkerMatch
      : palette.previousFretMarker
    : getCellFill(palette, isColored, fret);
  let border: string | undefined;
  let glow: string | undefined;
  if (marker?.isChordBeingDetected === true) {
    border = palette.chordDetection;
    glow = palette.chordDetectionGlow;
  } else if (marker?.isScaleBeingDetected === true) {
    border = palette.scaleDetection;
    glow = palette.scaleDetectionGlow;
  } else if (isFromPreviousChord) {
    border = palette.accentStrongest;
  }
  return {
    fill,
    text: isFromPreviousChord ? palette.background : palette.foreground,
    border,
    glow,
  };
};

const drawMarkers = (
  ctx: CanvasRenderingContext2D,
  state: DrawState,
  store: FretMarkerStore,
  now: number,
) => {
  const { layout, neck, palette, scaleX, scaleY, originX, originY } = state;
  const shiftedNote = getShiftedNote(capoValue, tuningValue);
  const blasts: { x: number; y: number; marker: FretMarkerState }[] = [];

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  neck.forEach((row, string) => {
    row.forEach((stringOctaveNote, fret) => {
      if (!stringOctaveNote) {
        return;
      }
      const column = layout.columns[fret];
      const x = (originX + column.centerX) / scaleX;
      const y = (originY + layout.getStringCenterY(string, fret)) / scaleY;
      const marker = store.get(string, fret);
      const colors = getMarkerColors(
        palette,
        marker,
        stringOctaveNote.note === shiftedNote,
        fret,
      );

      let fill = colors.fill;
      ctx.globalAlpha = 1;
      if (
        marker?.pressStartedAt !== undefined &&
        now - marker.pressStartedAt < PRESS_ANIMATION_MS
      ) {
        // flashes to the press colour and back
        const progress = (now - marker.pressStartedAt) / PRESS_ANIMATION_MS;
        const amount = 1 - Math.abs(2 * progress - 1);
        fill = mixColors(fill, palette.notePress, amount);
        ctx.globalAlpha = 1 - 0.3 * amount;
      }

      if (colors.glow !== undefined) {
        ctx.save();
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = GLOW_BLUR;
        ctx.fillStyle = colors.glow;
        ctx.beginPath();
        ctx.arc(x, y, MARKER_RADIUS + GLOW_SPREAD, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(x, y, MARKER_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      if (colors.border !== undefined) {
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = DETECTION_BORDER;
        ctx.beginPath();
        ctx.arc(x, y, MARKER_RADIUS - DETECTION_BORDER / 2, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.font = FONT;
      ctx.fillStyle = colors.text;
      ctx.fillText(
        getMarkerText(stringOctaveNote, state.noteDisplayMode),
        x,
        y,
      );
      ctx.globalAlpha = 1;

      if (marker?.chordFinger !== undefined) {
        const badgeX = x + 18;
        const badgeY = y - 10;
        ctx.fillStyle = RED_500;
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, BADGE_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = BADGE_FONT;
        ctx.fillStyle = "#ffffff";
        ctx.fillText(String(marker.chordFinger + 1), badgeX, badgeY);
      }

      if (
        marker?.blastStartedAt !== undefined &&
        now - marker.blastStartedAt < BLAST_ANIMATION_MS
      ) {
        blasts.push({ x, y, marker });
      }
    });
  });

  // the blasts spread over the neighbouring notes
  for (const { x, y, marker } of blasts) {
    const progress = (now - marker.blastStartedAt!) / BLAST_ANIMATION_MS;
    const opacity =
      progress < 0.05
        ? 0.9 * easeOut(progress / 0.05)
        : 0.9 * (1 - easeOut((progress - 0.05) / 0.95));
    ctx.globalAlpha = opacity;
    ctx.fillStyle = palette.tracks[marker.blastTrack % palette.tracks.length];
    ctx.beginPath();
    ctx.arc(
      x,
      y,
      BLAST_START_RADIUS * BLAST_MAX_SCALE * easeOut(progress),
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;
};

const useWindowSize = () => {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  useEffect(() => {
    const handleResize = trailingDebounce(
      () => setSize({ width: window.innerWidth, height: window.innerHeight }),
      200,
    );
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return size;
};

const useImage = (src: string) => {
  const [image, setImage] = useState<HTMLImageElement | undefined>();
  useEffect(() => {
    const element = new window.Image();
    element.onload = () => setImage(element);
    element.src = src;
    return () => {
      element.onload = null;
    };
  }, [src]);
  return image;
};

export const Fretboard: React.FC = () => {
  const skin = useUiSelector((s) => s.skin);
  const theme = useUiSelector((s) => s.theme);
  const scaleX = useUiSelector((s) => s.fretboardScaleX);
  const scaleY = useUiSelector((s) => s.fretboardScaleY);
  const chordsExpanded = useUiSelector((s) => s.chordsExpanded);
  const slashChordsExpanded = useUiSelector((s) => s.slashChordsExpanded);
  const noteDisplayMode = useUiSelector((s) => s.noteDisplayMode);
  const neck = useSettingsSelector((s) => s.neck);
  const { width, height } = useWindowSize();
  const hasTouchInput = useInputChecker();
  const containerRef = useRef<HTMLDivElement>(null);
  const boardLayerRef = useRef<Konva.Layer>(null);
  const markersLayerRef = useRef<Konva.Layer>(null);
  const store = useMemo(() => new FretMarkerStore(), []);
  const image = useImage(ASSETS_URL + getAssetsForSkin(skin));

  const stringCount = neck?.length ?? 0;
  const layout = useMemo(() => {
    const { widthStep, height, stringTilt } = getParametersForSkin(skin);
    return getFretboardLayout(
      FRET_COUNT,
      stringCount,
      widthStep,
      height,
      stringTilt,
    );
  }, [skin, stringCount]);

  const position = getPositionForSkin(skin);
  const isHeightEnoughToShowLargeChords =
    height >= MIN_HEIGHT_TO_SHOW_LARGE_CHORDS;
  const needYShift = chordsExpanded && isHeightEnoughToShowLargeChords;
  const sectionHeight =
    height * scaleY + (isHeightEnoughToShowLargeChords ? -100 : 0);
  const originX =
    position.xShift +
    (isHeightEnoughToShowLargeChords
      ? 0
      : interpolate(
          scaleX,
          1,
          3,
          slashChordsExpanded ? -210 : -240,
          slashChordsExpanded ? 400 : 300,
        ));
  const originY = (sectionHeight - layout.height) / 2 + (needYShift ? -100 : 0);

  const imageX = originX + position.left;
  const imageY = originY + position.top;
  const imageClipWidth = Math.min(
    IMAGE_WIDTH,
    Math.max(width * scaleX, 2000) - position.left - 12 * scaleX,
  );
  const imageClipHeight = Math.min(
    IMAGE_HEIGHT,
    Math.max((height - 380) * scaleY, 400) -
      position.top +
      (needYShift ? 160 : 0),
  );
  const stageWidth = Math.ceil(
    Math.max(imageX + imageClipWidth, originX + layout.width) / scaleX,
  );
  const stageHeight = Math.ceil(
    Math.max(imageY + imageClipHeight, originY + layout.height) / scaleY,
  );

  const drawState = useRef<DrawState | undefined>(undefined);
  useLayoutEffect(() => {
    const next: DrawState | undefined = neck
      ? {
          layout,
          neck,
          palette: getPalette(theme),
          scaleX,
          scaleY,
          originX,
          originY,
          noteDisplayMode,
        }
      : undefined;
    if (isSameDrawState(drawState.current, next)) {
      return;
    }
    drawState.current = next;
    boardLayerRef.current?.batchDraw();
    markersLayerRef.current?.batchDraw();
  });

  useSafePixelRatio([boardLayerRef, markersLayerRef], stageWidth, stageHeight);

  useEffect(() => {
    const layer = markersLayerRef.current;
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
      store.onChange(() => {});
    };
  }, [store, neck]);

  useEffect(() => (neck ? store.register(neck) : undefined), [neck, store]);

  useFretboardPinchZoom(containerRef, !!neck);

  if (!neck) {
    return null;
  }

  const toLayoutPoint = (clientX: number, clientY: number) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * scaleX - originX,
      y: (clientY - rect.top) * scaleY - originY,
    };
  };

  const hitAt = (clientX: number, clientY: number) => {
    const { x, y } = toLayoutPoint(clientX, clientY);
    return findFretHit(
      layout,
      x,
      y,
      (string, fret) => (neck[string]?.[fret] ?? null) !== null,
      neck.length,
    );
  };

  const handlePress = async (clientX: number, clientY: number) => {
    const hit = hitAt(clientX, clientY);
    if (!hit) {
      return;
    }
    if (hit.kind === "header") {
      console.log(
        "Playing all the notes on fret %d at tick %d",
        hit.fret,
        currentTick,
      );
      for (const string of neck) {
        const stringOctaveNote = string[hit.fret];
        if (stringOctaveNote) {
          NotePlayEventBus.next({ stringOctaveNote });
          await sleep(chordStrummingDelayMsValue);
        }
      }
      return;
    }
    const stringOctaveNote = neck[hit.string][hit.fret]!;
    console.log(
      "Playing note (manual) %o at tick %d",
      stringOctaveNote,
      currentTick,
    );
    NotePlayEventBus.next({ stringOctaveNote });
  };

  const handleHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const hit = hitAt(e.clientX, e.clientY);
    const container = e.currentTarget;
    container.style.cursor = hit ? "pointer" : "";
    const finger =
      hit?.kind === "note"
        ? store.get(hit.string, hit.fret)?.chordFinger
        : undefined;
    container.title = finger !== undefined ? FINGER_NAMES[finger] : "";
  };

  return (
    <section
      {...{ [NO_LONG_PRESS_ATTRIBUTE]: true }}
      // isolate keeps the canvas under the fixed panels, as the old CSS transform did
      className="relative isolate min-w-full"
      style={{ height: sectionHeight }}
    >
      <div
        ref={containerRef}
        id={FRETBOARD}
        className="absolute top-0 left-0 z-10"
        // the browser keeps scrolling, the pinch goes to useFretboardPinchZoom
        style={{
          width: stageWidth,
          height: stageHeight,
          touchAction: "pan-x pan-y",
        }}
        onTouchStartCapture={
          hasTouchInput
            ? (e) => {
                for (const touch of Array.from(e.changedTouches)) {
                  void handlePress(touch.clientX, touch.clientY);
                }
              }
            : undefined
        }
        onMouseDownCapture={
          hasTouchInput
            ? undefined
            : (e) => void handlePress(e.clientX, e.clientY)
        }
        onMouseMove={hasTouchInput ? undefined : handleHover}
      >
        <Stage width={stageWidth} height={stageHeight} listening={false}>
          <Layer ref={boardLayerRef} listening={false}>
            <Group scaleX={1 / scaleX} scaleY={1 / scaleY}>
              <Group
                clipX={imageX}
                clipY={imageY}
                clipWidth={imageClipWidth}
                clipHeight={imageClipHeight}
              >
                {image && (
                  <KonvaImage
                    image={image}
                    x={imageX}
                    y={imageY}
                    width={IMAGE_WIDTH * IMAGE_SCALE}
                    height={IMAGE_HEIGHT * IMAGE_SCALE}
                  />
                )}
              </Group>
            </Group>
            <Shape
              sceneFunc={(context) => {
                if (drawState.current) {
                  drawBoard(getNativeContext(context), drawState.current);
                }
              }}
            />
          </Layer>
          <Layer ref={markersLayerRef} listening={false}>
            <Shape
              sceneFunc={(context) => {
                if (drawState.current) {
                  drawMarkers(
                    getNativeContext(context),
                    drawState.current,
                    store,
                    performance.now(),
                  );
                }
              }}
            />
          </Layer>
        </Stage>
      </div>
    </section>
  );
};
