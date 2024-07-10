import React, { useEffect, useRef } from "react";
import { PianoRollGrid } from "./PianoRollGrid";
import { PianoRollNotes } from "./PianoRollNotes";
import { PitchAxis } from "./PitchAxis";
import { Timeline } from "./Timeline";

import { usePianoRoll } from "@/app/context/PianoRollProvider";
import {
  OCTAVE_COUNT,
  PIXELS_PER_TICK,
  TOTAL_HEIGHT,
  TOTAL_WIDTH,
} from "@/app/data/pianoRollConstants";
import { parseChordNoteAndAlterations } from "@/app/engine/chords/chordParser";
import { ChordOrNote } from "@/app/engine/eventsByTick";
import { getPitchPosition } from "@/app/helpers/pianoRollHelper";

const calculateNotesCenter = (
  notes: { tick: number; events: ChordOrNote[] }[]
) => {
  let minTick = Infinity;
  let maxTick = -Infinity;
  let minPitch = Infinity;
  let maxPitch = -Infinity;

  notes.forEach(({ tick, events }) => {
    minTick = Math.min(minTick, tick);
    maxTick = Math.max(maxTick, tick);

    events.forEach((event) => {
      const octaveNote =
        "chord" in event
          ? {
              octave: 5,
              note: parseChordNoteAndAlterations(event.chord!.chord)
                .chordBaseNote,
            }
          : event.note!.note;
      const pitch = getPitchPosition({
        note: octaveNote.note,
        octave: OCTAVE_COUNT - octaveNote.octave - 1,
      });
      minPitch = Math.min(minPitch, pitch);
      maxPitch = Math.max(maxPitch, pitch);
    });
  });

  return {
    x: ((minTick + maxTick) / 2) * PIXELS_PER_TICK,
    y: (minPitch + maxPitch) / 2,
  };
};

export const PianoRoll: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pitchAxisRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const { notes, loaded, setLoaded } = usePianoRoll();

  useEffect(() => {
    // sticky headers
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (pitchAxisRef.current) {
        pitchAxisRef.current.style.left = `${container.scrollLeft}px`;
      }
      if (timelineRef.current) {
        timelineRef.current.style.top = `${container.scrollTop}px`;
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // scroll to the notes
    if (loaded || !containerRef.current || !notes.length) {
      return;
    }

    const container = containerRef.current;
    const { x, y } = calculateNotesCenter(notes);

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    container.scrollLeft = x - containerWidth / 2;
    container.scrollTop = y - containerHeight / 2;
    setLoaded(true);
  }, [loaded, notes, setLoaded]);

  return (
    <div
      className="relative w-full h-full bg-red overflow-auto"
      ref={containerRef}
    >
      <PitchAxis ref={pitchAxisRef} className="absolute left-0 top-0 z-20" />
      <div
        className="relative left-28 top-0"
        style={{ width: `${TOTAL_WIDTH}px`, height: `${TOTAL_HEIGHT}px` }}
      >
        <Timeline
          ref={timelineRef}
          width={TOTAL_WIDTH}
          pixelsPerTick={PIXELS_PER_TICK}
        />
        <PianoRollGrid width={TOTAL_WIDTH} height={TOTAL_HEIGHT} />
        <PianoRollNotes />
      </div>
    </div>
  );
};
