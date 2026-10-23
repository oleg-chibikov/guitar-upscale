import {
  drawPlayhead,
  drawScene,
  hitTestNote,
  PianoRollScene,
  pitchAtAxisPoint,
  Viewport,
} from "@/app/components/pianoRoll/pianoRollDrawing";
import {
  BEATS_IN_BAR,
  PITCH_AXIS_WIDTH,
  TIMELINE_HEIGHT,
} from "@/app/data/pianoRollConstants";
import { ChordOrNote } from "@/app/engine/eventsByTick";
import { isChordModeAvailable } from "@/app/engine/pianoRoll/pianoRollEvent";
import { getNativeContext } from "@/app/helpers/canvas/konvaHelpers";
import { PianoRollTool } from "@/app/store/pianoRollSlice";
import Konva from "konva";
import React, {
  RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import { Layer, Shape, Stage } from "react-konva";
import { Observable } from "rxjs";

type Handler<E> = (e: E) => void;

export interface NoteAreaHandlers {
  onPointerDown: Handler<React.PointerEvent<HTMLDivElement>>;
  onPointerMove: Handler<React.PointerEvent<HTMLDivElement>>;
  onPointerUp: Handler<React.PointerEvent<HTMLDivElement>>;
  onPointerCancel: Handler<React.PointerEvent<HTMLDivElement>>;
  onDoubleClick: Handler<React.MouseEvent<HTMLDivElement>>;
}

interface PianoRollCanvasProps {
  scene: Omit<PianoRollScene, "pressedPitch">;
  scrollerRef: RefObject<HTMLDivElement | null>;
  viewportWidth: number;
  viewportHeight: number;
  playhead$: Observable<number>;
  tool: PianoRollTool;
  noteHandlers: NoteAreaHandlers;
  // x in grid px
  onSeek: (x: number, exact: boolean) => void;
  onKeyPress: (pitch: number) => void;
}

type Region = "corner" | "timeline" | "keys" | "notes";

type HoverPoint = { clientX: number; clientY: number; altKey: boolean };

const PRESS_HIGHLIGHT_MS = 200;

const toolCursor: Record<PianoRollTool, string> = {
  [PianoRollTool.Select]: "default",
  [PianoRollTool.Draw]: "crosshair",
  [PianoRollTool.Erase]: "cell",
};

const UNAVAILABLE_CHORD_TITLE =
  "This chord isn't available with the current chord settings. Double-click to pick another";

/**
 * The grid, notes, ruler, keyboard and playhead on one canvas the size of the view.
 * The scroller around it scrolls natively, the canvas redraws what's in view.
 */
export const PianoRollCanvas: React.FC<PianoRollCanvasProps> = ({
  scene,
  scrollerRef,
  viewportWidth,
  viewportHeight,
  playhead$,
  tool,
  noteHandlers,
  onSeek,
  onKeyPress,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainLayerRef = useRef<Konva.Layer>(null);
  const playheadLayerRef = useRef<Konva.Layer>(null);
  const regions = useRef(new Map<number, Region>());
  const lastKeyY = useRef<number | undefined>(undefined);
  const pressedPitch = useRef<number | undefined>(undefined);
  const playheadTick = useRef(0);
  const lastHover = useRef<HoverPoint | undefined>(undefined);

  const sceneRef = useRef<PianoRollScene | undefined>(undefined);
  const viewport = (): Viewport => ({
    scrollLeft: scrollerRef.current?.scrollLeft ?? 0,
    scrollTop: scrollerRef.current?.scrollTop ?? 0,
    width: viewportWidth,
    height: viewportHeight,
  });
  const viewportRef = useRef(viewport);
  useLayoutEffect(() => {
    viewportRef.current = viewport;
    sceneRef.current = { ...scene, pressedPitch: pressedPitch.current };
    mainLayerRef.current?.batchDraw();
    playheadLayerRef.current?.batchDraw();
  });

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    // draw in the same frame as the scroll, so the canvas doesn't lag behind
    const redraw = () => {
      mainLayerRef.current?.draw();
      playheadLayerRef.current?.draw();
    };
    scroller.addEventListener("scroll", redraw, { passive: true });
    return () => scroller.removeEventListener("scroll", redraw);
  }, [scrollerRef]);

  useEffect(() => {
    const subscription = playhead$.subscribe((tick) => {
      playheadTick.current = tick;
      playheadLayerRef.current?.batchDraw();
    });
    return () => subscription.unsubscribe();
  }, [playhead$]);

  const toLocal = (e: { clientX: number; clientY: number }) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const regionAt = ({ x, y }: { x: number; y: number }): Region => {
    if (y < TIMELINE_HEIGHT) {
      return x < PITCH_AXIS_WIDTH ? "corner" : "timeline";
    }
    return x < PITCH_AXIS_WIDTH ? "keys" : "notes";
  };

  const seek = (e: React.PointerEvent<HTMLDivElement>) => {
    const { x } = toLocal(e);
    const scrollLeft = scrollerRef.current?.scrollLeft ?? 0;
    onSeek(x - PITCH_AXIS_WIDTH + scrollLeft, e.shiftKey);
  };

  const pressKey = (y: number, x: number) => {
    const { zoom } = scene;
    const scrollTop = scrollerRef.current?.scrollTop ?? 0;
    const pitch = pitchAtAxisPoint(zoom, x, y - TIMELINE_HEIGHT + scrollTop);
    onKeyPress(pitch);
    pressedPitch.current = pitch;
    if (sceneRef.current) sceneRef.current.pressedPitch = pitch;
    mainLayerRef.current?.batchDraw();
    setTimeout(() => {
      if (pressedPitch.current !== pitch) return;
      pressedPitch.current = undefined;
      if (sceneRef.current) sceneRef.current.pressedPitch = undefined;
      mainLayerRef.current?.batchDraw();
    }, PRESS_HIGHLIGHT_MS);
  };

  const updateHover = (e: HoverPoint) => {
    const container = containerRef.current;
    if (!container) return;
    lastHover.current = e;
    const point = toLocal(e);
    const region = regionAt(point);
    let cursor = "";
    let title = "";
    if (region === "timeline") {
      cursor = "text";
      title = `${BEATS_IN_BAR}/4`;
    } else if (region === "keys") {
      cursor = "pointer";
    } else if (region === "notes") {
      const { events, selection, zoom } = scene;
      const scroller = scrollerRef.current;
      const hit = hitTestNote(
        events,
        selection,
        zoom,
        point.x - PITCH_AXIS_WIDTH + (scroller?.scrollLeft ?? 0),
        point.y - TIMELINE_HEIGHT + (scroller?.scrollTop ?? 0)
      );
      if (hit) {
        cursor = hit.edge ? "ew-resize" : "move";
        const event: ChordOrNote | undefined = events.find(
          ({ event }) => event.id === hit.id
        )?.event;
        if (event && !isChordModeAvailable(event)) {
          title = UNAVAILABLE_CHORD_TITLE;
        }
      } else {
        cursor = toolCursor[e.altKey ? PianoRollTool.Draw : tool];
      }
    }
    container.style.cursor = cursor;
    container.title = title;
  };
  const updateHoverRef = useRef(updateHover);
  useLayoutEffect(() => {
    updateHoverRef.current = updateHover;
  });

  // holding Alt swaps the cursor to the pen without moving the mouse
  useEffect(() => {
    const handleAlt = (e: KeyboardEvent) => {
      if (e.key !== "Alt" || !lastHover.current) return;
      updateHoverRef.current({ ...lastHover.current, altKey: e.altKey });
    };
    const clearAlt = () => {
      if (lastHover.current) updateHoverRef.current({ ...lastHover.current, altKey: false });
    };
    document.addEventListener("keydown", handleAlt);
    document.addEventListener("keyup", handleAlt);
    window.addEventListener("blur", clearAlt);
    return () => {
      document.removeEventListener("keydown", handleAlt);
      document.removeEventListener("keyup", handleAlt);
      window.removeEventListener("blur", clearAlt);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const point = toLocal(e);
    const region = regionAt(point);
    regions.current.set(e.pointerId, region);
    switch (region) {
      case "timeline":
        e.currentTarget.setPointerCapture(e.pointerId);
        seek(e);
        return;
      case "keys":
        e.currentTarget.setPointerCapture(e.pointerId);
        lastKeyY.current = e.clientY;
        pressKey(point.y, point.x);
        return;
      case "notes":
        noteHandlers.onPointerDown(e);
        return;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const region = regions.current.get(e.pointerId);
    switch (region) {
      case "timeline":
        seek(e);
        return;
      case "keys": {
        // dragging the keyboard scrolls it, as the page used to
        const scroller = scrollerRef.current;
        if (scroller && lastKeyY.current !== undefined) {
          scroller.scrollTop -= e.clientY - lastKeyY.current;
        }
        lastKeyY.current = e.clientY;
        return;
      }
      case "notes":
        noteHandlers.onPointerMove(e);
        return;
      case undefined:
        if (e.pointerType === "mouse") updateHover(e);
        return;
    }
  };

  const handlePointerEnd = (
    e: React.PointerEvent<HTMLDivElement>,
    cancelled: boolean
  ) => {
    const region = regions.current.get(e.pointerId);
    regions.current.delete(e.pointerId);
    if (region === "notes") {
      if (cancelled) {
        noteHandlers.onPointerCancel(e);
      } else {
        noteHandlers.onPointerUp(e);
      }
    }
    lastKeyY.current = undefined;
  };

  return (
    <div
      ref={containerRef}
      className="touch-none select-none"
      style={{ width: viewportWidth, height: viewportHeight }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(e) => handlePointerEnd(e, false)}
      onPointerCancel={(e) => handlePointerEnd(e, true)}
      onPointerLeave={() => (lastHover.current = undefined)}
      onDoubleClick={(e) => {
        if (regionAt(toLocal(e)) === "notes") noteHandlers.onDoubleClick(e);
      }}
    >
      <Stage width={viewportWidth} height={viewportHeight} listening={false}>
        <Layer ref={mainLayerRef} listening={false}>
          <Shape
            sceneFunc={(context) => {
              if (sceneRef.current) {
                drawScene(
                  getNativeContext(context),
                  sceneRef.current,
                  viewportRef.current()
                );
              }
            }}
          />
        </Layer>
        <Layer ref={playheadLayerRef} listening={false}>
          <Shape
            sceneFunc={(context) => {
              if (sceneRef.current) {
                drawPlayhead(
                  getNativeContext(context),
                  playheadTick.current,
                  sceneRef.current.zoom,
                  viewportRef.current()
                );
              }
            }}
          />
        </Layer>
      </Stage>
    </div>
  );
};
