import { hitTestNote } from "@/app/components/pianoRoll/pianoRollDrawing";
import { usePianoRoll } from "@/app/context/PianoRollProvider";
import { Note } from "@/app/data/notes";
import {
  DRAG_THRESHOLD_PX,
  LONG_PRESS_MS,
  PITCH_AXIS_WIDTH,
  TIMELINE_HEIGHT,
} from "@/app/data/pianoRollConstants";
import {
  ChordOrNote,
  EventForTick,
  EventsByTick,
} from "@/app/engine/eventsByTick";
import {
  pitchToY,
  tickToX,
  xToTick,
  yToPitch,
  Zoom,
} from "@/app/engine/pianoRoll/geometry";
import {
  addEvent,
  deleteEvents,
  moveEvents,
  MoveTarget,
  resizeEvents,
  ResizeEdge,
  ResizeTarget,
  resolveMove,
  resolveResize,
} from "@/app/engine/pianoRoll/operations";
import {
  createNoteEvent,
  getEventDuration,
  getEventPitch,
  withPitch,
} from "@/app/engine/pianoRoll/pianoRollEvent";
import {
  getEventTrack,
  PianoRollTrack,
} from "@/app/engine/pianoRoll/pianoRollTracks";
import {
  floorTick,
  snapPitchToScale,
  snapTick,
} from "@/app/engine/pianoRoll/snap";
import { playChordOrNote } from "@/app/engine/playerHelper";
import { usePianoRollSelector } from "@/app/hooks/storeHooks";
import { PianoRollTool } from "@/app/store/pianoRollSlice";
import React, {
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

export type Preview =
  | { kind: "move"; targets: Map<string, MoveTarget>; copy: boolean }
  | { kind: "resize"; targets: Map<string, ResizeTarget> }
  | { kind: "rubber"; x: number; y: number; width: number; height: number }
  | { kind: "draw"; tick: number; event: ChordOrNote }
  | { kind: "erase"; ids: ReadonlySet<string> };

type Point = { clientX: number; clientY: number };

type Modifiers = {
  shiftKey: boolean;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
};

type Gesture =
  | {
      kind: "note";
      start: { x: number; y: number };
      noteId: string;
      edge: ResizeEdge | undefined;
      ids: string[];
      dragging: boolean;
      lastPitch: number;
      // set once the drag picks a direction while the axis lock is on
      axis: "time" | "pitch" | undefined;
      pointerType: string;
    }
  | {
      kind: "rubber";
      start: { x: number; y: number };
      base: ReadonlySet<string>;
      dragging: boolean;
    }
  | { kind: "draw"; tick: number; event: ChordOrNote }
  | { kind: "erase"; ids: Set<string> }
  | {
      kind: "pinch";
      ids: [number, number];
      startSpread: { x: number; y: number };
      startZoom: Zoom;
      lastMid: Point;
    }
  | {
      kind: "pan";
      start: Point;
      last: Point & { time: number };
      velocity: { x: number; y: number };
      moved: boolean;
      // a middle button drag pans without inertia and keeps the selection
      mouse: boolean;
      longPress: ReturnType<typeof setTimeout> | undefined;
    };

export interface NoteAreaInteractionOptions {
  scrollerRef: RefObject<HTMLDivElement | null>;
  zoom: Zoom;
  snapTicks: number;
  // undefined when notes move freely between all semitones
  scalePattern: Set<Note> | undefined;
  tool: PianoRollTool;
  zoomTo: (zoom: Partial<Zoom>, anchor?: Point) => void;
}

const AUTO_SCROLL_EDGE_PX = 28;
const AUTO_SCROLL_MAX_SPEED_PX = 18;
const INERTIA_DECAY = 0.94;
const INERTIA_MIN_SPEED = 0.02;
// fingers closer than this along an axis don't zoom that axis
const MIN_PINCH_SPREAD_PX = 40;
const DOUBLE_TAP_MS = 350;

const noModifiers: Modifiers = {
  shiftKey: false,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
};

const eventRect = (tick: number, event: ChordOrNote, zoom: Zoom) => ({
  x: tickToX(tick, zoom),
  y: pitchToY(getEventPitch(event), zoom),
  width: getEventDuration(event) * zoom.pixelsPerTick,
  height: zoom.noteHeight,
});

const findNoteTemplate = (
  data: EventsByTick,
  events: EventForTick[],
  selection: ReadonlySet<string>,
  activeTrack: PianoRollTrack | undefined,
) => {
  const fromSelection = Array.from(selection)
    .map((id) => data.getEvent(id)?.event.note)
    .find((note) => note !== undefined);
  const note =
    fromSelection ?? events.find(({ event }) => event.note)?.event.note;
  if (note) {
    return {
      trackNumber: note.trackNumber,
      instrument: note.instrument,
      looperChannel: note.looperChannel,
    };
  }
  // the first note in an empty track
  return activeTrack
    ? {
        trackNumber: activeTrack.trackNumber,
        instrument: activeTrack.instrument,
      }
    : undefined;
};

export const useNoteAreaInteraction = ({
  scrollerRef,
  zoom,
  snapTicks,
  scalePattern,
  tool,
  zoomTo,
}: NoteAreaInteractionOptions) => {
  const touchPoints = useRef(new Map<number, Point>());
  // touch screens have no Alt or Ctrl, so toolbar toggles stand in for them
  const copyMode = usePianoRollSelector((s) => s.copyMode);
  const axisLock = usePianoRollSelector((s) => s.axisLock);
  const {
    data,
    events,
    inactiveEvents,
    selection,
    setSelection,
    apply,
    chooseChordMode,
    activeTrack,
    setActiveTrack,
    source,
  } = usePianoRoll();
  const lastTap = useRef<{ id: string; time: number } | undefined>(undefined);
  const [preview, setPreview] = useState<Preview | undefined>();
  const gestureRef = useRef<Gesture | undefined>(undefined);
  const lastPointerRef = useRef<(Point & Modifiers) | undefined>(undefined);
  const autoScrollFrame = useRef<number | undefined>(undefined);
  const inertiaFrame = useRef<number | undefined>(undefined);

  // the handlers read the latest values through a ref, so listeners stay stable during a drag
  const latest = {
    data,
    events,
    inactiveEvents,
    selection,
    zoom,
    snapTicks,
    scalePattern,
    tool,
    copyMode,
    axisLock,
    activeTrack,
    setActiveTrack,
    isSong: source?.looperChannel === undefined,
  };
  const state = useRef(latest);
  useLayoutEffect(() => {
    state.current = latest;
  });

  const isCopy = (pointer: Modifiers) =>
    pointer.altKey || state.current.copyMode;

  const moveTargets = (
    gesture: Extract<Gesture, { kind: "note" }>,
    pointer: Point & Modifiers,
  ) => {
    const { data, zoom, snapTicks, scalePattern, axisLock } = state.current;
    const anchor = data!.getEvent(gesture.noteId)!;
    const { x, y } = toContent(pointer);
    const dx = x - gesture.start.x;
    const dy = y - gesture.start.y;

    if (pointer.ctrlKey || pointer.metaKey || axisLock) {
      gesture.axis ??= Math.abs(dx) >= Math.abs(dy) ? "time" : "pitch";
    } else {
      gesture.axis = undefined;
    }

    const rawTick = anchor.tick + dx / zoom.pixelsPerTick;
    const deltaTick =
      gesture.axis === "pitch" ? 0 : snapTick(rawTick, snapTicks) - anchor.tick;
    const deltaPitch =
      gesture.axis === "time"
        ? 0
        : yToPitch(y, zoom) - yToPitch(gesture.start.y, zoom);
    return resolveMove(data!, gesture.ids, deltaTick, deltaPitch, scalePattern);
  };

  const resizeTargets = (
    gesture: Extract<Gesture, { kind: "note" }>,
    pointer: Point,
  ) => {
    const { data, zoom, snapTicks } = state.current;
    const { x } = toContent(pointer);
    return resolveResize(
      data!,
      gesture.ids,
      gesture.noteId,
      gesture.edge!,
      (x - gesture.start.x) / zoom.pixelsPerTick,
      snapTicks,
    );
  };

  // grid px, with the scroll taken into account
  const toContent = useCallback(
    ({ clientX, clientY }: Point) => {
      const scroller = scrollerRef.current!;
      const rect = scroller.getBoundingClientRect();
      return {
        x:
          clientX -
          rect.left -
          scroller.clientLeft -
          PITCH_AXIS_WIDTH +
          scroller.scrollLeft,
        y:
          clientY -
          rect.top -
          scroller.clientTop -
          TIMELINE_HEIGHT +
          scroller.scrollTop,
      };
    },
    [scrollerRef],
  );

  const noteAt = (point: Point) => {
    const { events, selection, zoom } = state.current;
    const { x, y } = toContent(point);
    return hitTestNote(events, selection, zoom, x, y);
  };

  const inactiveNoteAt = (point: Point) => {
    const { inactiveEvents, zoom } = state.current;
    const { x, y } = toContent(point);
    return hitTestNote(inactiveEvents, new Set(), zoom, x, y);
  };

  const snapPitch = (pitch: number) => {
    const { scalePattern } = state.current;
    return scalePattern ? snapPitchToScale(pitch, scalePattern) : pitch;
  };

  const stopAutoScroll = () => {
    if (autoScrollFrame.current !== undefined) {
      cancelAnimationFrame(autoScrollFrame.current);
      autoScrollFrame.current = undefined;
    }
  };

  const stopInertia = () => {
    if (inertiaFrame.current !== undefined) {
      cancelAnimationFrame(inertiaFrame.current);
      inertiaFrame.current = undefined;
    }
  };

  const updateGesture = useCallback(
    (pointer: Point & Modifiers) => {
      const gesture = gestureRef.current;
      const { data, events, zoom, snapTicks } = state.current;
      if (!gesture || !data) return;
      const { x, y } = toContent(pointer);

      switch (gesture.kind) {
        case "note": {
          if (
            !gesture.dragging &&
            Math.hypot(x - gesture.start.x, y - gesture.start.y) <
              DRAG_THRESHOLD_PX
          ) {
            return;
          }
          gesture.dragging = true;
          const anchor = data.getEvent(gesture.noteId);
          if (!anchor) return;

          if (gesture.edge) {
            setPreview({
              kind: "resize",
              targets: resizeTargets(gesture, pointer),
            });
            return;
          }

          const targets = moveTargets(gesture, pointer);
          const anchorPitch = targets.get(gesture.noteId)?.pitch;
          if (anchorPitch !== undefined && anchorPitch !== gesture.lastPitch) {
            gesture.lastPitch = anchorPitch;
            const moved = withPitch(anchor.event, anchorPitch);
            if (moved) playChordOrNote(moved.event);
          }
          setPreview({ kind: "move", targets, copy: isCopy(pointer) });
          return;
        }
        case "rubber": {
          if (
            !gesture.dragging &&
            Math.hypot(x - gesture.start.x, y - gesture.start.y) <
              DRAG_THRESHOLD_PX
          ) {
            return;
          }
          gesture.dragging = true;
          const rect = {
            x: Math.min(x, gesture.start.x),
            y: Math.min(y, gesture.start.y),
            width: Math.abs(x - gesture.start.x),
            height: Math.abs(y - gesture.start.y),
          };
          const hit = new Set(pointer.shiftKey ? gesture.base : []);
          events.forEach(({ tick, event }) => {
            const r = eventRect(tick, event, zoom);
            if (
              r.x < rect.x + rect.width &&
              r.x + r.width > rect.x &&
              r.y < rect.y + rect.height &&
              r.y + r.height > rect.y
            ) {
              hit.add(event.id);
            }
          });
          setSelection(hit);
          setPreview({ kind: "rubber", ...rect });
          return;
        }
        case "draw": {
          const endTick = Math.max(
            gesture.tick + snapTicks,
            snapTick(xToTick(x, zoom), snapTicks),
          );
          gesture.event = {
            ...gesture.event,
            duration: endTick - gesture.tick,
          };
          setPreview({
            kind: "draw",
            tick: gesture.tick,
            event: gesture.event,
          });
          return;
        }
        case "erase": {
          const id = noteAt(pointer)?.id;
          if (id !== undefined && !gesture.ids.has(id)) {
            gesture.ids.add(id);
            setPreview({ kind: "erase", ids: new Set(gesture.ids) });
          }
          return;
        }
        case "pinch": {
          const scroller = scrollerRef.current;
          const [a, b] = gesture.ids.map((id) => touchPoints.current.get(id));
          if (!scroller || !a || !b) return;
          const mid = {
            clientX: (a.clientX + b.clientX) / 2,
            clientY: (a.clientY + b.clientY) / 2,
          };
          const spread = (start: number, now: number) =>
            start >= MIN_PINCH_SPREAD_PX ? Math.max(now, 1) / start : 1;
          scroller.scrollLeft -= mid.clientX - gesture.lastMid.clientX;
          scroller.scrollTop -= mid.clientY - gesture.lastMid.clientY;
          gesture.lastMid = mid;
          zoomTo(
            {
              pixelsPerTick:
                gesture.startZoom.pixelsPerTick *
                spread(gesture.startSpread.x, Math.abs(a.clientX - b.clientX)),
              noteHeight:
                gesture.startZoom.noteHeight *
                spread(gesture.startSpread.y, Math.abs(a.clientY - b.clientY)),
            },
            mid,
          );
          return;
        }
        case "pan": {
          const scroller = scrollerRef.current;
          if (!scroller) return;
          const now = performance.now();
          const dx = pointer.clientX - gesture.last.clientX;
          const dy = pointer.clientY - gesture.last.clientY;
          if (
            !gesture.moved &&
            Math.hypot(
              pointer.clientX - gesture.start.clientX,
              pointer.clientY - gesture.start.clientY,
            ) < DRAG_THRESHOLD_PX
          ) {
            return;
          }
          gesture.moved = true;
          clearTimeout(gesture.longPress);
          scroller.scrollLeft -= dx;
          scroller.scrollTop -= dy;
          const dt = Math.max(1, now - gesture.last.time);
          gesture.velocity = { x: dx / dt, y: dy / dt };
          gesture.last = {
            clientX: pointer.clientX,
            clientY: pointer.clientY,
            time: now,
          };
          return;
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [toContent, scrollerRef, setSelection],
  );

  // dragging near an edge keeps scrolling the view while the pointer stays still
  const runAutoScroll = useCallback(() => {
    stopAutoScroll();
    const step = () => {
      const scroller = scrollerRef.current;
      const pointer = lastPointerRef.current;
      const gesture = gestureRef.current;
      if (
        !scroller ||
        !pointer ||
        !gesture ||
        gesture.kind === "pan" ||
        gesture.kind === "pinch"
      ) {
        autoScrollFrame.current = undefined;
        return;
      }
      // a press near the edge stays a click until the pointer itself moves
      if (
        (gesture.kind === "note" || gesture.kind === "rubber") &&
        !gesture.dragging
      ) {
        autoScrollFrame.current = requestAnimationFrame(step);
        return;
      }
      const rect = scroller.getBoundingClientRect();
      const speed = (distance: number) =>
        distance < AUTO_SCROLL_EDGE_PX
          ? ((AUTO_SCROLL_EDGE_PX - distance) / AUTO_SCROLL_EDGE_PX) *
            AUTO_SCROLL_MAX_SPEED_PX
          : 0;
      const dx =
        speed(pointer.clientX - rect.left) * -1 +
        speed(rect.right - pointer.clientX);
      const dy =
        speed(pointer.clientY - rect.top) * -1 +
        speed(rect.bottom - pointer.clientY);
      if (dx || dy) {
        scroller.scrollLeft += dx;
        scroller.scrollTop += dy;
        updateGesture(pointer);
      }
      autoScrollFrame.current = requestAnimationFrame(step);
    };
    autoScrollFrame.current = requestAnimationFrame(step);
  }, [scrollerRef, updateGesture]);

  const startInertia = (velocity: { x: number; y: number }) => {
    stopInertia();
    let { x, y } = velocity;
    let last = performance.now();
    const step = (now: number) => {
      const scroller = scrollerRef.current;
      if (
        !scroller ||
        (Math.abs(x) < INERTIA_MIN_SPEED && Math.abs(y) < INERTIA_MIN_SPEED)
      ) {
        inertiaFrame.current = undefined;
        return;
      }
      const dt = now - last;
      last = now;
      scroller.scrollLeft -= x * dt;
      scroller.scrollTop -= y * dt;
      x *= INERTIA_DECAY;
      y *= INERTIA_DECAY;
      inertiaFrame.current = requestAnimationFrame(step);
    };
    inertiaFrame.current = requestAnimationFrame(step);
  };

  const finishGesture = useCallback(
    (pointer: (Point & Modifiers) | undefined, cancelled: boolean) => {
      const gesture = gestureRef.current;
      gestureRef.current = undefined;
      lastPointerRef.current = undefined;
      stopAutoScroll();
      setPreview(undefined);
      const { data, isSong } = state.current;
      if (!gesture || !data) return;

      if (cancelled) {
        if (gesture.kind === "pan") clearTimeout(gesture.longPress);
        return;
      }

      switch (gesture.kind) {
        case "note": {
          if (!gesture.dragging) {
            // a plain click on one of many selected notes keeps only that note
            if (pointer?.shiftKey !== true) setSelection([gesture.noteId]);
            // mobile browsers send no dblclick, so two quick taps on a chord open its modes
            const now = performance.now();
            if (
              gesture.pointerType !== "mouse" &&
              lastTap.current?.id === gesture.noteId &&
              now - lastTap.current.time < DOUBLE_TAP_MS
            ) {
              lastTap.current = undefined;
              if (data.getEvent(gesture.noteId)?.event.chord) {
                chooseChordMode(gesture.noteId);
              }
            } else {
              lastTap.current = { id: gesture.noteId, time: now };
            }
            return;
          }
          if (!pointer || !data.getEvent(gesture.noteId)) return;
          apply(
            gesture.edge
              ? resizeEvents(data, resizeTargets(gesture, pointer))
              : moveEvents(
                  data,
                  moveTargets(gesture, pointer),
                  isCopy(pointer),
                ),
          );
          return;
        }
        case "rubber":
          if (!gesture.dragging && pointer?.shiftKey !== true) setSelection([]);
          return;
        case "draw":
          apply(addEvent(data, gesture.tick, gesture.event));
          return;
        case "erase":
          apply(deleteEvents(data, gesture.ids, isSong));
          return;
        case "pinch":
          return;
        case "pan":
          clearTimeout(gesture.longPress);
          if (gesture.mouse) return;
          if (!gesture.moved) {
            setSelection([]);
          } else if (performance.now() - gesture.last.time < 80) {
            startInertia(gesture.velocity);
          }
          return;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apply, setSelection, toContent, updateGesture],
  );

  const startDraw = (x: number, y: number) => {
    const { data, events, zoom, snapTicks, selection, activeTrack } =
      state.current;
    if (!data) return;
    const tick = floorTick(xToTick(x, zoom), snapTicks);
    const pitch = snapPitch(yToPitch(y, zoom));
    const event = createNoteEvent(
      pitch,
      snapTicks,
      findNoteTemplate(data, events, selection, activeTrack),
    );
    if (!event) return;
    playChordOrNote(event);
    gestureRef.current = { kind: "draw", tick, event };
    setPreview({ kind: "draw", tick, event });
  };

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "mouse" && e.button === 1 && !gestureRef.current) {
        stopInertia();
        e.currentTarget.setPointerCapture(e.pointerId);
        e.currentTarget.style.cursor = "grabbing";
        const pointer = { clientX: e.clientX, clientY: e.clientY };
        gestureRef.current = {
          kind: "pan",
          start: pointer,
          last: { ...pointer, time: performance.now() },
          velocity: { x: 0, y: 0 },
          moved: true,
          mouse: true,
          longPress: undefined,
        };
        return;
      }
      if (e.button !== 0 && e.pointerType === "mouse") return;
      const { data } = state.current;
      // holding Alt draws whatever tool is picked. Alt on a note still copies it
      const tool = e.altKey ? PianoRollTool.Draw : state.current.tool;
      if (!data) return;
      stopInertia();
      if (e.pointerType === "touch") {
        touchPoints.current.set(e.pointerId, e);
      }
      if (gestureRef.current) {
        // a second finger drops whatever the first one started and zooms instead
        finishGesture(undefined, true);
        const fingers = Array.from(touchPoints.current.entries());
        if (fingers.length === 2) {
          e.currentTarget.setPointerCapture(e.pointerId);
          const [[idA, a], [idB, b]] = fingers;
          gestureRef.current = {
            kind: "pinch",
            ids: [idA, idB],
            startSpread: {
              x: Math.abs(a.clientX - b.clientX),
              y: Math.abs(a.clientY - b.clientY),
            },
            startZoom: state.current.zoom,
            lastMid: {
              clientX: (a.clientX + b.clientX) / 2,
              clientY: (a.clientY + b.clientY) / 2,
            },
          };
        }
        return;
      }

      e.currentTarget.setPointerCapture(e.pointerId);
      const point = toContent(e);
      lastPointerRef.current = e;
      const activeHit = noteAt(e);
      // a note of a dimmed track makes its track the one being edited
      const inactiveHit = activeHit ? undefined : inactiveNoteAt(e);
      const inactiveEvent = inactiveHit && data.getEvent(inactiveHit.id)?.event;
      if (inactiveEvent) {
        state.current.setActiveTrack(getEventTrack(inactiveEvent));
      }
      const hit = activeHit ?? (inactiveEvent ? inactiveHit : undefined);
      const selection = inactiveEvent
        ? new Set<string>()
        : state.current.selection;
      const noteId = hit?.id;

      if (tool === PianoRollTool.Erase) {
        const ids = new Set(noteId !== undefined ? [noteId] : []);
        gestureRef.current = { kind: "erase", ids };
        setPreview({ kind: "erase", ids: new Set(ids) });
        return;
      }

      if (noteId !== undefined) {
        const noteState = data.getEvent(noteId);
        if (!noteState) return;
        let newSelection = selection;
        if (e.shiftKey) {
          const toggled = new Set(selection);
          if (toggled.has(noteId)) {
            toggled.delete(noteId);
          } else {
            toggled.add(noteId);
          }
          newSelection = toggled;
          setSelection(toggled);
          if (!toggled.has(noteId)) return;
        } else if (!selection.has(noteId)) {
          newSelection = new Set([noteId]);
          setSelection(newSelection);
        }
        playChordOrNote(noteState.event);
        const edge = hit?.edge;
        gestureRef.current = {
          kind: "note",
          start: point,
          noteId,
          edge,
          ids: Array.from(newSelection),
          dragging: false,
          lastPitch: getEventPitch(noteState.event),
          axis: undefined,
          pointerType: e.pointerType,
        };
        runAutoScroll();
        return;
      }

      if (tool === PianoRollTool.Draw) {
        startDraw(point.x, point.y);
        runAutoScroll();
        return;
      }

      if (e.pointerType === "mouse") {
        gestureRef.current = {
          kind: "rubber",
          start: point,
          base: selection,
          dragging: false,
        };
        runAutoScroll();
        return;
      }

      // touch on empty space scrolls. Holding still first draws a selection rectangle
      const pointer = { clientX: e.clientX, clientY: e.clientY };
      const gesture: Extract<Gesture, { kind: "pan" }> = {
        kind: "pan",
        start: pointer,
        last: { ...pointer, time: performance.now() },
        velocity: { x: 0, y: 0 },
        moved: false,
        mouse: false,
        longPress: setTimeout(() => {
          if (gestureRef.current !== gesture || gesture.moved) return;
          navigator.vibrate?.(10);
          gestureRef.current = {
            kind: "rubber",
            start: point,
            base: new Set(),
            dragging: false,
          };
          runAutoScroll();
        }, LONG_PRESS_MS),
      };
      gestureRef.current = gesture;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [finishGesture, runAutoScroll, setSelection, toContent],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (touchPoints.current.has(e.pointerId)) {
        touchPoints.current.set(e.pointerId, e);
      }
      if (!gestureRef.current) return;
      lastPointerRef.current = e;
      updateGesture(e);
    },
    [updateGesture],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      touchPoints.current.delete(e.pointerId);
      if (!gestureRef.current) return;
      finishGesture(e, false);
    },
    [finishGesture],
  );

  const onPointerCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      touchPoints.current.delete(e.pointerId);
      finishGesture(undefined, true);
    },
    [finishGesture],
  );

  // double click on empty space adds a note, as in Cubase. On a chord it offers the other modes
  const onDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const { data, tool } = state.current;
      if (!data) return;
      const noteId = noteAt(e)?.id;
      if (noteId !== undefined) {
        if (data.getEvent(noteId)?.event.chord) chooseChordMode(noteId);
        return;
      }
      if (tool !== PianoRollTool.Select) return;
      const { x, y } = toContent(e);
      startDraw(x, y);
      finishGesture(
        { ...noModifiers, clientX: e.clientX, clientY: e.clientY },
        false,
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [finishGesture, toContent, chooseChordMode],
  );

  // pressing or releasing a modifier mid-drag switches between move and copy straight away
  useEffect(() => {
    const handleModifier = (e: KeyboardEvent) => {
      const pointer = lastPointerRef.current;
      if (!gestureRef.current || !pointer) return;
      if (!["Alt", "Control", "Meta", "Shift"].includes(e.key)) return;
      const updated = {
        clientX: pointer.clientX,
        clientY: pointer.clientY,
        altKey: e.altKey,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        shiftKey: e.shiftKey,
      };
      lastPointerRef.current = updated;
      updateGesture(updated);
      e.preventDefault();
    };
    document.addEventListener("keydown", handleModifier);
    document.addEventListener("keyup", handleModifier);
    return () => {
      document.removeEventListener("keydown", handleModifier);
      document.removeEventListener("keyup", handleModifier);
    };
  }, [updateGesture]);

  useEffect(
    () => () => {
      stopAutoScroll();
      stopInertia();
    },
    [],
  );

  return {
    preview,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onDoubleClick,
    },
  };
};
