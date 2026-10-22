import { NoteArea } from "@/app/components/pianoRoll/NoteArea";
import { Playhead } from "@/app/components/pianoRoll/Playhead";
import { PitchAxis } from "@/app/components/pianoRoll/PitchAxis";
import { Timeline } from "@/app/components/pianoRoll/Timeline";
import { getGridBackground } from "@/app/components/pianoRoll/gridBackground";
import { useFollowPlayhead } from "@/app/components/pianoRoll/useFollowPlayhead";
import { usePianoRollShortcuts } from "@/app/components/pianoRoll/usePianoRollShortcuts";
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
  getContentHeight,
  getTotalTicks,
  pitchToY,
  tickToX,
} from "@/app/engine/pianoRoll/geometry";
import {
  getEventDuration,
  getEventPitch,
} from "@/app/engine/pianoRoll/pianoRollEvent";
import { usePianoRollSelector } from "@/app/hooks/storeHooks";
import React, { useEffect, useMemo } from "react";

// how strongly one wheel notch or trackpad pinch step zooms
const WHEEL_ZOOM_SPEED = 0.0025;

export const PianoRoll: React.FC = () => {
  const { scrollerRef, zoom, zoomBy } = usePianoRollView();
  const { events, loaded, setLoaded } = usePianoRoll();
  const { scalePattern } = useScaleContext();
  const { baseNote } = useBaseNoteContext();
  const snap = usePianoRollSelector((s) => s.pianoRollSnap);
  const tool = usePianoRollSelector((s) => s.tool);
  const snapToScale = usePianoRollSelector((s) => s.snapToScale);
  const snapTicks = getTicksForTimeSignature(snap);

  usePianoRollShortcuts();
  useFollowPlayhead(scrollerRef, zoom);

  const lastEndTick = useMemo(
    () =>
      events.reduce(
        (end, { tick, event }) => Math.max(end, tick + getEventDuration(event)),
        0
      ),
    [events]
  );
  const totalTicks = getTotalTicks(lastEndTick);
  const width = tickToX(totalTicks, zoom);
  const height = getContentHeight(zoom);

  const gridStyle = useMemo(
    () => getGridBackground(zoom, snapTicks, scalePattern, baseNote),
    [zoom, snapTicks, scalePattern, baseNote]
  );

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
    // open on the notes
    const scroller = scrollerRef.current;
    if (loaded || !scroller || !events.length) {
      return;
    }
    const ticks = events.map(({ tick }) => tick);
    const pitches = events.map(({ event }) => getEventPitch(event));
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
      className="relative w-full h-full overflow-auto overscroll-contain bg-[#1e272b]"
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: `${PITCH_AXIS_WIDTH}px ${width}px`,
          gridTemplateRows: `${TIMELINE_HEIGHT}px ${height}px`,
        }}
      >
        <div className="sticky left-0 top-0 z-30 bg-gray-300 border-b border-r border-gray-400" />
        <Timeline
          className="sticky top-0 z-20"
          zoom={zoom}
          totalTicks={totalTicks}
        >
          <Playhead zoom={zoom} variant="marker" />
        </Timeline>
        <PitchAxis className="sticky left-0 z-20" zoom={zoom} />
        <NoteArea
          zoom={zoom}
          width={width}
          height={height}
          snapTicks={snapTicks}
          scalePattern={snapToScale ? scalePattern : undefined}
          tool={tool}
          scrollerRef={scrollerRef}
          gridStyle={gridStyle}
        >
          <Playhead zoom={zoom} variant="line" />
        </NoteArea>
      </div>
    </div>
  );
};
