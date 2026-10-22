import { NoteArea } from "@/app/components/pianoRoll/NoteArea";
import { PitchAxis } from "@/app/components/pianoRoll/PitchAxis";
import { Timeline } from "@/app/components/pianoRoll/Timeline";
import { getGridBackground } from "@/app/components/pianoRoll/gridBackground";
import { usePianoRollShortcuts } from "@/app/components/pianoRoll/usePianoRollShortcuts";
import { useBaseNoteContext } from "@/app/context/BaseNoteProvider";
import { usePianoRoll } from "@/app/context/PianoRollProvider";
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
  Zoom,
} from "@/app/engine/pianoRoll/geometry";
import {
  getEventDuration,
  getEventPitch,
} from "@/app/engine/pianoRoll/pianoRollEvent";
import { usePianoRollSelector } from "@/app/hooks/storeHooks";
import React, { useEffect, useMemo, useRef } from "react";

export const PianoRoll: React.FC = () => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { events, loaded, setLoaded } = usePianoRoll();
  const { scalePattern } = useScaleContext();
  const { baseNote } = useBaseNoteContext();
  const snap = usePianoRollSelector((s) => s.pianoRollSnap);
  const tool = usePianoRollSelector((s) => s.tool);
  const snapToScale = usePianoRollSelector((s) => s.snapToScale);
  const pixelsPerTick = usePianoRollSelector((s) => s.pixelsPerTick);
  const noteHeight = usePianoRollSelector((s) => s.noteHeight);
  const zoom: Zoom = useMemo(
    () => ({ pixelsPerTick, noteHeight }),
    [pixelsPerTick, noteHeight]
  );
  const snapTicks = getTicksForTimeSignature(snap);

  usePianoRollShortcuts();

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
  }, [loaded, events, setLoaded, zoom]);

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
        />
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
        />
      </div>
    </div>
  );
};
