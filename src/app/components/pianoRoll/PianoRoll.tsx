import {
  allNotes,
  NOTE_HEIGHT,
  PitchAxis,
  TOTAL_HEIGHT,
} from "@/app/components/pianoRoll/PitchAxis";
import { Timeline } from "@/app/components/pianoRoll/Timeline";
import { BEATS_IN_BAR, TICKS_IN_BEAT } from "@/app/data/clockConstants";
import { isSharp, NOTE_COUNT, OctaveNote } from "@/app/data/notes";
import { parseChordNoteAndAlterations } from "@/app/engine/chords/chordParser";
import { ChordOrNote } from "@/app/engine/eventsByTick";
import React, { useEffect, useRef, useState } from "react";

interface PianoRollProps {
  notes: { tick: number; events: ChordOrNote[] }[];
}

const PIXELS_PER_TICK = 2;
const BEAT_WIDTH = TICKS_IN_BEAT * PIXELS_PER_TICK;
const TOTAL_BEATS = 100;
const TOTAL_WIDTH = TOTAL_BEATS * BEAT_WIDTH;

export const PianoRoll: React.FC<PianoRollProps> = ({ notes }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggedNote, setDraggedNote] = useState<{
    id: string;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    note: ChordOrNote;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = TOTAL_WIDTH;
    canvas.height = TOTAL_HEIGHT;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render piano roll background
    renderPianoRollBackground(ctx);

    // Render grid
    renderGrid(ctx);

    // Render dragged note
    if (draggedNote) {
      renderDraggedNote(ctx);
    }

    // Render notes
    notes.forEach(({ tick, events }) => {
      events.forEach((event, index) => renderNote(ctx, event, tick, index));
    });
  }, [notes, draggedNote]);

  const renderPianoRollBackground = (ctx: CanvasRenderingContext2D) => {
    for (let octave = 0; octave <= MAX_OCTAVE; octave++) {
      for (let note = 0; note < NOTE_COUNT; note++) {
        const yPosition = getPitchPosition({ octave, note });

        ctx.fillStyle = !isSharp(note) ? "#363636" : "#212121"; // gray-100 for white keys, gray-300 for black keys
        ctx.fillRect(0, yPosition, TOTAL_WIDTH, NOTE_HEIGHT);

        // Draw horizontal line
        // ctx.strokeStyle = "#9ca3af"; // gray-400
        ctx.beginPath();
        ctx.moveTo(0, yPosition);
        ctx.lineTo(TOTAL_WIDTH, yPosition);
        ctx.stroke();
      }
    }
  };

  const renderGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = "#9ca3af"; // gray-300

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

  const renderNote = (
    ctx: CanvasRenderingContext2D,
    note: ChordOrNote,
    tick: number
  ) => {
    const isChord = "chord" in note;
    let octaveNote: OctaveNote;
    if (isChord) {
      const { chordBaseNote } = parseChordNoteAndAlterations(note.chord!.chord);
      octaveNote = { octave: 5, note: chordBaseNote };
    } else {
      octaveNote = note.note!.note;
    }
    const duration = TICKS_IN_BEAT * PIXELS_PER_TICK; // Default duration of one beat
    const yPosition = getPitchPosition(octaveNote);
    const xPosition = tick * PIXELS_PER_TICK;

    ctx.fillStyle = isChord ? "#3b82f6" : "#22c55e"; // blue-500 or green-500
    ctx.fillRect(xPosition, yPosition, duration, NOTE_HEIGHT);
    ctx.strokeStyle = "#d1d5db"; // gray-300
    ctx.strokeRect(xPosition, yPosition, duration, NOTE_HEIGHT);
  };

  const renderDraggedNote = (ctx: CanvasRenderingContext2D) => {
    if (!draggedNote) return;

    const { startX, startY, offsetX, offsetY, note } = draggedNote;
    const isChord = "chord" in note;
    const duration = TICKS_IN_BEAT * PIXELS_PER_TICK; // Default duration of one beat

    // Calculate snapped positions
    const xPosition =
      Math.round((startX + offsetX) / PIXELS_PER_TICK) * PIXELS_PER_TICK;
    const yPosition =
      Math.round((startY + offsetY) / NOTE_HEIGHT) * NOTE_HEIGHT;

    ctx.fillStyle = isChord ? "#3b82f6" : "#22c55e"; // blue-500 or green-500
    ctx.fillRect(xPosition, yPosition, duration, NOTE_HEIGHT);
    ctx.strokeStyle = "#d1d5db"; // gray-300
    ctx.strokeRect(xPosition, yPosition, duration, NOTE_HEIGHT);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find the clicked note (this is a simplification, you may need a more sophisticated method)
    const clickedTick = Math.floor(x / PIXELS_PER_TICK);
    const clickedPitch = Math.floor(y / NOTE_HEIGHT);
    const clickedNote = notes
      .flatMap(({ events }) => events)
      .find((event) => {
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
        const noteY = getPitchPosition(octaveNote);
        const noteX = clickedTick * PIXELS_PER_TICK;
        return (
          y >= noteY &&
          y <= noteY + NOTE_HEIGHT &&
          x >= noteX &&
          x <= noteX + TICKS_IN_BEAT * PIXELS_PER_TICK
        );
      });

    if (clickedNote) {
      setDraggedNote({
        id: `${clickedTick}-${clickedPitch}`,
        startX: x,
        startY: y,
        offsetX: 0,
        offsetY: 0,
        note: clickedNote,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedNote) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const offsetX = x - draggedNote.startX;
      const offsetY = y - draggedNote.startY;

      setDraggedNote((prev) => (prev ? { ...prev, offsetX, offsetY } : prev));
    }
  };

  const handleMouseUp = () => {
    if (draggedNote) {
      // Update the note's position in your data structure here
      // For now, just log the new position
      console.log(
        "Dropped note:",
        draggedNote.id,
        Math.round(draggedNote.offsetX / PIXELS_PER_TICK) * PIXELS_PER_TICK,
        Math.round(draggedNote.offsetY / NOTE_HEIGHT) * NOTE_HEIGHT
      );
    }
    setDraggedNote(null);
  };

  const MAX_OCTAVE = 8;

  const getPitchPosition = (octaveNote: OctaveNote): number => {
    const { octave, note } = octaveNote;
    const octavePosition = octave * allNotes.length * NOTE_HEIGHT;
    const notePosition = allNotes.indexOf(note) * NOTE_HEIGHT;

    return octavePosition + notePosition;
  };

  return (
    <div className="relative w-full h-full bg-red overflow-auto">
      <PitchAxis className="absolute left-0 top-0 z-10" width={100} />
      <div
        className="relative left-28 top-0"
        style={{ width: `${TOTAL_WIDTH}px` }}
      >
        <Timeline width={TOTAL_WIDTH} pixelsPerTick={PIXELS_PER_TICK} />
        {/* <PitchAxis
          className="absolute"
          showNoteLabels={false}
          darkNoteColor="bg-gray-900"
          lightNoteColor="bg-gray-800"
          noteBorderColor="border-gray-800"
          width={TOTAL_WIDTH}
        /> */}
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  );
};
