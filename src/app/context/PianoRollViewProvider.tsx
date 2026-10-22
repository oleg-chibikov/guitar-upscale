import { usePianoRoll } from "@/app/context/PianoRollProvider";
import {
  PITCH_AXIS_WIDTH,
  TIMELINE_HEIGHT,
} from "@/app/data/pianoRollConstants";
import { pitchToY, Zoom } from "@/app/engine/pianoRoll/geometry";
import {
  getEventDuration,
  getEventPitch,
} from "@/app/engine/pianoRoll/pianoRollEvent";
import { usePianoRollSelector } from "@/app/hooks/storeHooks";
import {
  clampNoteHeight,
  clampPixelsPerTick,
  setPianoRollZoom,
} from "@/app/store/pianoRollSlice";
import React, {
  createContext,
  ReactNode,
  RefObject,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { useDispatch } from "react-redux";

type ClientPoint = { clientX: number; clientY: number };

interface PianoRollViewContextType {
  scrollerRef: RefObject<HTMLDivElement | null>;
  zoom: Zoom;
  // the point under the anchor stays where it is. Without one, the middle of the view does
  zoomTo: (zoom: Partial<Zoom>, anchor?: ClientPoint) => void;
  zoomBy: (factorX: number, factorY: number, anchor?: ClientPoint) => void;
  zoomToFit: () => void;
}

const PianoRollViewContext = createContext<
  PianoRollViewContextType | undefined
>(undefined);

export const usePianoRollView = () => {
  const context = useContext(PianoRollViewContext);
  if (context === undefined) {
    throw new Error(
      "usePianoRollView must be used within a PianoRollViewProvider"
    );
  }
  return context;
};

const FIT_MARGIN = 0.9;

// runs once the grid has its new size
type PendingScroll = (scroller: HTMLDivElement, zoom: Zoom) => void;

export const PianoRollViewProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const { events } = usePianoRoll();
  const pixelsPerTick = usePianoRollSelector((s) => s.pixelsPerTick);
  const noteHeight = usePianoRollSelector((s) => s.noteHeight);
  const zoom = useMemo(
    () => ({ pixelsPerTick, noteHeight }),
    [pixelsPerTick, noteHeight]
  );
  const pendingScroll = useRef<PendingScroll | undefined>(undefined);
  const zoomRef = useRef(zoom);
  useLayoutEffect(() => {
    zoomRef.current = zoom;
  });

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    const scroll = pendingScroll.current;
    pendingScroll.current = undefined;
    if (scroller && scroll) scroll(scroller, zoom);
  }, [zoom]);

  const applyZoom = useCallback(
    (target: Zoom, scroll: PendingScroll) => {
      const scroller = scrollerRef.current;
      const current = zoomRef.current;
      const clamped = {
        pixelsPerTick: clampPixelsPerTick(target.pixelsPerTick),
        noteHeight: clampNoteHeight(target.noteHeight),
      };
      if (
        clamped.pixelsPerTick === current.pixelsPerTick &&
        clamped.noteHeight === current.noteHeight
      ) {
        if (scroller) scroll(scroller, current);
        return;
      }
      pendingScroll.current = scroll;
      dispatch(setPianoRollZoom(clamped));
    },
    [dispatch]
  );

  const zoomTo = useCallback(
    (target: Partial<Zoom>, anchor?: ClientPoint) => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const current = zoomRef.current;
      // remember where in the music the anchor points, then put that spot back under it
      const rect = scroller.getBoundingClientRect();
      const offsetX =
        anchor !== undefined
          ? anchor.clientX - rect.left
          : PITCH_AXIS_WIDTH + (scroller.clientWidth - PITCH_AXIS_WIDTH) / 2;
      const offsetY =
        anchor !== undefined
          ? anchor.clientY - rect.top
          : TIMELINE_HEIGHT + (scroller.clientHeight - TIMELINE_HEIGHT) / 2;
      const tick =
        (scroller.scrollLeft + offsetX - PITCH_AXIS_WIDTH) /
        current.pixelsPerTick;
      const row =
        (scroller.scrollTop + offsetY - TIMELINE_HEIGHT) / current.noteHeight;
      applyZoom({ ...current, ...target }, (scroller, applied) => {
        scroller.scrollLeft =
          tick * applied.pixelsPerTick + PITCH_AXIS_WIDTH - offsetX;
        scroller.scrollTop =
          row * applied.noteHeight + TIMELINE_HEIGHT - offsetY;
      });
    },
    [applyZoom]
  );

  const zoomBy = useCallback(
    (factorX: number, factorY: number, anchor?: ClientPoint) => {
      const current = zoomRef.current;
      zoomTo(
        {
          pixelsPerTick: current.pixelsPerTick * factorX,
          noteHeight: current.noteHeight * factorY,
        },
        anchor
      );
    },
    [zoomTo]
  );

  const zoomToFit = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !events.length) return;
    const start = Math.min(...events.map(({ tick }) => tick));
    const end = Math.max(
      ...events.map(({ tick, event }) => tick + getEventDuration(event))
    );
    const pitches = events.map(({ event }) => getEventPitch(event));
    const top = Math.max(...pitches);
    const rows = top - Math.min(...pitches) + 1;
    const width = scroller.clientWidth - PITCH_AXIS_WIDTH;
    const height = scroller.clientHeight - TIMELINE_HEIGHT;
    applyZoom(
      {
        pixelsPerTick: (width * FIT_MARGIN) / Math.max(1, end - start),
        noteHeight: (height * FIT_MARGIN) / rows,
      },
      (scroller, applied) => {
        scroller.scrollLeft =
          start * applied.pixelsPerTick -
          (width - (end - start) * applied.pixelsPerTick) / 2;
        scroller.scrollTop =
          pitchToY(top, applied) - (height - rows * applied.noteHeight) / 2;
      }
    );
  }, [applyZoom, events]);

  const value = useMemo(
    () => ({ scrollerRef, zoom, zoomTo, zoomBy, zoomToFit }),
    [zoom, zoomTo, zoomBy, zoomToFit]
  );

  return (
    <PianoRollViewContext.Provider value={value}>
      {children}
    </PianoRollViewContext.Provider>
  );
};
