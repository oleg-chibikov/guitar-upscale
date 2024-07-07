import {
  allNotes,
  NOTE_HEIGHT,
  OCTAVE_COUNT,
  PitchAxis,
  TOTAL_HEIGHT,
} from "@/app/components/pianoRoll/PitchAxis";
import { Timeline } from "@/app/components/pianoRoll/Timeline";
import { BEATS_IN_BAR, TICKS_IN_BEAT } from "@/app/data/clockConstants";
import { isSharp, NOTE_COUNT, OctaveNote } from "@/app/data/notes";
import { parseChordNoteAndAlterations } from "@/app/engine/chords/chordParser";
import { ChordOrNote } from "@/app/engine/eventsByTick";
import React, { useEffect, useRef } from "react";

interface PianoRollProps {
  notes: { tick: number; events: ChordOrNote[] }[];
  onNoteMove?: (noteId: string, newTick: number, newPitch: number) => void;
}

const PIXELS_PER_TICK = 2;
const BEAT_WIDTH = TICKS_IN_BEAT * PIXELS_PER_TICK;
const TOTAL_BEATS = 100;
const TOTAL_WIDTH = TOTAL_BEATS * BEAT_WIDTH;

export const PianoRoll: React.FC<PianoRollProps> = ({ notes, onNoteMove }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pitchAxisRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const draggedNoteRef = useRef<{
    element: HTMLElement;
    noteId: string;
    startX: number;
    startY: number;
    originalLeft: number;
    originalTop: number;
  } | null>(null);

  useEffect(() => {
    // render grid and background
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = TOTAL_WIDTH;
    canvas.height = TOTAL_HEIGHT;

    renderPianoRollBackground(ctx);
    renderGrid(ctx);
  }, []);

  useEffect(() => {
    // scroll to notes
    if (!containerRef.current) return;

    const container = containerRef.current;
    const { x, y } = calculateNotesCenter();

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    container.scrollLeft = x - containerWidth / 2;
    container.scrollTop = y - containerHeight / 2;
  }, [notes]);

  useEffect(() => {
    // support sticky headers
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

  const calculateNotesCenter = () => {
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
        const pitch = getPitchPosition(octaveNote);
        minPitch = Math.min(minPitch, pitch);
        maxPitch = Math.max(maxPitch, pitch);
      });
    });

    return {
      x: ((minTick + maxTick) / 2) * PIXELS_PER_TICK,
      y: (minPitch + maxPitch) / 2,
    };
  };

  const handleMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    noteId: string
  ) => {
    const element = e.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    const containerRect = containerRef.current!.getBoundingClientRect();

    draggedNoteRef.current = {
      element,
      noteId,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      originalLeft: rect.left - containerRect.left,
      originalTop: rect.top - containerRect.top,
    };
    element.style.zIndex = "10";
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggedNoteRef.current) return;

    const { element, startX, startY, originalLeft, originalTop } =
      draggedNoteRef.current;
    const containerRect = containerRef.current!.getBoundingClientRect();

    let newLeft = e.clientX - containerRect.left - startX;
    let newTop = e.clientY - containerRect.top - startY;

    // Snap to ticks
    newLeft = Math.round(newLeft / PIXELS_PER_TICK) * PIXELS_PER_TICK;

    // Snap to pitch lines
    newTop = Math.round(newTop / NOTE_HEIGHT) * NOTE_HEIGHT;

    // Constrain movement within the container
    newLeft = Math.max(0, Math.min(newLeft, TOTAL_WIDTH - element.offsetWidth));
    newTop = Math.max(0, Math.min(newTop, TOTAL_HEIGHT - element.offsetHeight));

    element.style.transform = `translate(${newLeft - originalLeft}px, ${
      newTop - originalTop
    }px)`;
  };

  const handleMouseUp = () => {
    if (draggedNoteRef.current) {
      const { element, noteId, originalLeft, originalTop } =
        draggedNoteRef.current;
      const transform = element.style.transform;
      const matches = transform.match(
        /translate\((-?\d+(?:\.\d+)?)px, (-?\d+(?:\.\d+)?)px\)/
      );

      if (matches) {
        const dx = parseFloat(matches[1]);
        const dy = parseFloat(matches[2]);

        const newLeft = originalLeft + dx;
        const newTop = originalTop + dy;

        const newTick = Math.round(newLeft / PIXELS_PER_TICK);
        const newPitch = Math.round(newTop / NOTE_HEIGHT);

        onNoteMove?.(noteId, newTick, newPitch);
      }

      element.style.zIndex = "";
      element.style.transform = "";
      draggedNoteRef.current = null;
    }
  };

  const getPitchPosition = (octaveNote: OctaveNote): number => {
    const { octave, note } = octaveNote;
    const octavePosition = octave * allNotes.length * NOTE_HEIGHT;
    const notePosition = allNotes.indexOf(note) * NOTE_HEIGHT;

    return octavePosition + notePosition;
  };

  const renderPianoRollBackground = (ctx: CanvasRenderingContext2D) => {
    for (let octave = 0; octave < OCTAVE_COUNT; octave++) {
      for (let note = 0; note < NOTE_COUNT; note++) {
        const yPosition = getPitchPosition({ octave, note });

        ctx.fillStyle = !isSharp(note) ? "#f3f4f6" : "#d1d5db"; // gray-100 for white keys, gray-300 for black keys
        ctx.fillRect(0, yPosition, TOTAL_WIDTH, NOTE_HEIGHT);

        // Draw horizontal line
        ctx.beginPath();
        ctx.moveTo(0, yPosition);
        ctx.lineTo(TOTAL_WIDTH, yPosition);
        ctx.strokeStyle = "#9ca3af"; // gray-400
        ctx.stroke();
      }
    }
  };

  const renderGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = "#9ca3af"; // gray-400

    for (let bar = 0; bar < TOTAL_BEATS / BEATS_IN_BAR; bar++) {
      for (let beat = 0; beat < BEATS_IN_BAR; beat++) {
        const xPosition = (bar * BEATS_IN_BAR + beat) * BEAT_WIDTH;
        ctx.beginPath();
        ctx.moveTo(xPosition, 0);
        ctx.lineTo(xPosition, TOTAL_HEIGHT);
        ctx.lineWidth = beat === 0 ? 2 : 1;
        ctx.stroke();
      }
    }
  };

  const renderNotes = () => {
    return notes.flatMap(({ tick, events }) =>
      events.map((event, index) => {
        const isChord = "chord" in event;
        let octaveNote: OctaveNote;
        if (isChord) {
          const { chordBaseNote } = parseChordNoteAndAlterations(
            event.chord!.chord
          );
          octaveNote = { octave: 5, note: chordBaseNote };
        } else {
          octaveNote = event.note!.note;
        }
        const duration = TICKS_IN_BEAT * PIXELS_PER_TICK;
        const yPosition = getPitchPosition(octaveNote);
        const xPosition = tick * PIXELS_PER_TICK;
        const noteId = `${tick}-${index}`;

        return (
          <div
            key={noteId}
            className="absolute cursor-move"
            style={{
              left: xPosition,
              top: yPosition,
              width: duration,
              height: NOTE_HEIGHT,
              backgroundColor: isChord ? "#3b82f6" : "#22c55e",
              border: "1px solid #d1d5db",
            }}
            onMouseDown={(e) => handleMouseDown(e, noteId)}
          />
        );
      })
    );
  };

  return (
    <div
      className="relative w-full h-full bg-red overflow-auto"
      ref={containerRef}
    >
      <PitchAxis
        className="absolute left-0 top-0 z-10"
        width={100}
        ref={pitchAxisRef}
      />
      <div
        className="relative left-28 top-0"
        style={{ width: `${TOTAL_WIDTH}px`, height: `${TOTAL_HEIGHT}px` }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <Timeline
          ref={timelineRef}
          width={TOTAL_WIDTH}
          pixelsPerTick={PIXELS_PER_TICK}
        />
        <canvas
          ref={canvasRef}
          className="absolute left-0 top-0"
          width={TOTAL_WIDTH}
          height={TOTAL_HEIGHT}
        />
        {renderNotes()}
      </div>
    </div>
  );
};
