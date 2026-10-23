import {
  PianoRollCanvas,
  RulerRangePhase,
} from "@/app/components/pianoRoll/PianoRollCanvas";
import { BACKGROUND } from "@/app/components/pianoRoll/pianoRollDrawing";
import { useNoteAreaInteraction } from "@/app/components/pianoRoll/useNoteAreaInteraction";
import { useFollowPlayhead } from "@/app/components/pianoRoll/useFollowPlayhead";
import { usePianoRollShortcuts } from "@/app/components/pianoRoll/usePianoRollShortcuts";
import { usePianoRollTransport } from "@/app/components/pianoRoll/usePianoRollTransport";
import {
  getLoopRange,
  LoopRange,
  loopRange$,
} from "@/app/engine/pianoRoll/playhead";
import { snapTick } from "@/app/engine/pianoRoll/snap";
import { useBaseNoteContext } from "@/app/context/BaseNoteProvider";
import { usePianoRoll } from "@/app/context/PianoRollProvider";
import { usePianoRollView } from "@/app/context/PianoRollViewProvider";
import { useScaleContext } from "@/app/context/ScaleProvider";
import { getTicksForTimeSignature } from "@/app/data/clockConstants";
import {
  PITCH_AXIS_WIDTH,
  TIMELINE_HEIGHT,
} from "@/app/data/pianoRollConstants";
import {
  fromPitch,
  getContentHeight,
  getTotalTicks,
  pitchToY,
  tickToX,
} from "@/app/engine/pianoRoll/geometry";
import {
  getEventDuration,
  getEventPitch,
} from "@/app/engine/pianoRoll/pianoRollEvent";
import { playNote } from "@/app/engine/sound/soundProvider";
import { usePianoRollSelector } from "@/app/hooks/storeHooks";
import React, { useCallback, useEffect, useMemo, useState } from "react";

// C4, the middle of the guitar range
const EMPTY_VIEW_PITCH = 48;

// how strongly one wheel notch or trackpad pinch step zooms
const WHEEL_ZOOM_SPEED = 0.0025;

export const PianoRoll: React.FC = () => {
  const { scrollerRef, zoom, zoomBy, zoomTo } = usePianoRollView();
  const {
    allEvents,
    events,
    inactiveEvents,
    tracks,
    selection,
    loaded,
    setLoaded,
    source,
    playhead$,
    data,
  } = usePianoRoll();
  const trackColors = useMemo(
    () =>
      tracks.length > 1
        ? new Map(tracks.map(({ trackNumber }, index) => [trackNumber, index]))
        : undefined,
    [tracks]
  );
  const loopLengthTicks = source?.loopLengthTicks;
  const { scalePattern } = useScaleContext();
  const { baseNote } = useBaseNoteContext();
  const snap = usePianoRollSelector((s) => s.pianoRollSnap);
  const tool = usePianoRollSelector((s) => s.tool);
  const snapToScale = usePianoRollSelector((s) => s.snapToScale);
  const snapTicks = getTicksForTimeSignature(snap);

  const { seekTo, loopRange, clearLoopOutside, isLoop } =
    usePianoRollTransport();
  usePianoRollShortcuts();
  useFollowPlayhead(scrollerRef, zoom);

  const lastEndTick = useMemo(
    () =>
      allEvents.reduce(
        (end, { tick, event }) => Math.max(end, tick + getEventDuration(event)),
        0
      ),
    [allEvents]
  );
  const totalTicks = getTotalTicks(Math.max(lastEndTick, loopLengthTicks ?? 0));
  const width = tickToX(totalTicks, zoom);
  const height = getContentHeight(zoom);

  const xToTick = useCallback(
    (x: number, exact: boolean) => {
      const tick = Math.max(0, x / zoom.pixelsPerTick);
      return exact ? Math.round(tick) : snapTick(tick, snapTicks);
    },
    [snapTicks, zoom]
  );

  // a click on the ruler moves the playhead. Shift turns off the grid
  const handleSeek = useCallback(
    (x: number, exact: boolean) => {
      const tick = xToTick(x, exact);
      clearLoopOutside(tick);
      seekTo(tick);
    },
    [xToTick, clearLoopOutside, seekTo]
  );

  const [savedLoop, setSavedLoop] = useState<LoopRange | undefined>(() =>
    data ? getLoopRange(data) : undefined
  );
  useEffect(() => {
    const subscription = loopRange$.subscribe(() =>
      setSavedLoop(data ? getLoopRange(data) : undefined)
    );
    return () => subscription.unsubscribe();
  }, [data]);
  const [draftLoop, setDraftLoop] = useState<LoopRange | undefined>();

  // a drag on the ruler loops the range under it as soon as the button goes up
  const handleRulerRange = useCallback(
    (fromX: number, toX: number, exact: boolean, phase: RulerRangePhase) => {
      if (isLoop) return;
      const from = xToTick(fromX, exact);
      const to = xToTick(toX, exact);
      const range =
        from === to
          ? undefined
          : { start: Math.min(from, to), end: Math.max(from, to) };
      setDraftLoop(phase === "drag" ? range : undefined);
      if (phase === "commit" && range) loopRange(range);
    },
    [isLoop, xToTick, loopRange]
  );

  const handleKeyPress = useCallback(
    (pitch: number) => void playNote(fromPitch(pitch)),
    []
  );

  const { preview, handlers } = useNoteAreaInteraction({
    scrollerRef,
    zoom,
    snapTicks,
    scalePattern: snapToScale ? scalePattern : undefined,
    tool,
    zoomTo,
  });

  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const observer = new ResizeObserver(() =>
      setViewportSize({
        width: scroller.clientWidth,
        height: scroller.clientHeight,
      })
    );
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [scrollerRef]);

  const contentWidth = PITCH_AXIS_WIDTH + width;
  const contentHeight = TIMELINE_HEIGHT + height;
  const viewportWidth = Math.min(viewportSize.width, contentWidth);
  const viewportHeight = Math.min(viewportSize.height, contentHeight);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    // Ctrl+wheel (and a trackpad pinch, which arrives as one) zooms time, Alt+wheel zooms pitch
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey && !e.altKey) return;
      e.preventDefault();
      const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
      const factor = Math.exp(-delta * WHEEL_ZOOM_SPEED);
      if (e.altKey) {
        zoomBy(1, factor, e);
      } else {
        zoomBy(factor, 1, e);
      }
    };
    scroller.addEventListener("wheel", handleWheel, { passive: false });
    return () => scroller.removeEventListener("wheel", handleWheel);
  }, [scrollerRef, zoomBy]);

  useEffect(() => {
    // open on the notes, or on the middle of the guitar range when there are none
    const scroller = scrollerRef.current;
    if (loaded || !scroller) {
      return;
    }
    const ticks = events.length ? events.map(({ tick }) => tick) : [0];
    const pitches = events.length
      ? events.map(({ event }) => getEventPitch(event))
      : [EMPTY_VIEW_PITCH];
    const x = tickToX(Math.min(...ticks), zoom);
    const y =
      (pitchToY(Math.max(...pitches), zoom) +
        pitchToY(Math.min(...pitches), zoom)) /
      2;
    scroller.scrollLeft = Math.max(0, x - PITCH_AXIS_WIDTH);
    scroller.scrollTop = y - (scroller.clientHeight - TIMELINE_HEIGHT) / 2;
    setLoaded(true);
  }, [loaded, events, setLoaded, zoom, scrollerRef]);

  return (
    <div
      ref={scrollerRef}
      className="relative w-full h-full overflow-auto overscroll-contain"
      style={{ background: BACKGROUND }}
    >
      <div
        className="relative"
        style={{ width: contentWidth, height: contentHeight }}
      >
        <div
          className="sticky left-0 top-0"
          style={{ width: viewportWidth, height: viewportHeight }}
        >
          {viewportWidth > 0 && viewportHeight > 0 && (
            <PianoRollCanvas
              scene={{
                zoom,
                width,
                height,
                snapTicks,
                scalePattern,
                baseNote,
                events,
                inactiveEvents,
                trackColors,
                selection,
                preview,
                loopLengthTicks,
                loopRange: isLoop ? undefined : (draftLoop ?? savedLoop),
              }}
              scrollerRef={scrollerRef}
              viewportWidth={viewportWidth}
              viewportHeight={viewportHeight}
              playhead$={playhead$}
              tool={tool}
              noteHandlers={handlers}
              onSeek={handleSeek}
              onRulerRange={handleRulerRange}
              onKeyPress={handleKeyPress}
            />
          )}
        </div>
      </div>
    </div>
  );
};
