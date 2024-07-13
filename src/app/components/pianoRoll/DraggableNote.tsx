import { usePianoRoll } from "@/app/context/PianoRollProvider";
import { useScaleContext } from "@/app/context/ScaleProvider";
import {
  getTicksForTimeSignature,
  TimeSignature,
} from "@/app/data/clockConstants";
import { Note, NOTE_COUNT, OctaveNote } from "@/app/data/notes";
import {
  NOTE_HEIGHT,
  PIXELS_PER_TICK,
  TOTAL_HEIGHT,
  TOTAL_WIDTH,
} from "@/app/data/pianoRollConstants";
import { ChordOrNote, getChordOrNoteText } from "@/app/engine/eventsByTick";
import { playChordOrNote } from "@/app/engine/playerHelper";
import { usePianoRollSelector } from "@/app/hooks/storeHooks";
import React, { useCallback, useEffect, useRef } from "react";

interface DraggableNoteProps {
  noteEvent: ChordOrNote;
  x: number;
  y: number;
  width: number;
  height: number;
  isChord: boolean;
}

// Helper function to calculate octave and note from pitch
const calculateOctaveNote = (pitch: number): OctaveNote => {
  const octave = Math.floor(pitch / NOTE_COUNT);
  const note = pitch % NOTE_COUNT;
  return { octave, note };
};

// Helper function to snap a pitch to the nearest note in the scale
const snapToScale = (pitch: number, scalePattern: Set<Note>): number => {
  const octave = Math.floor(pitch / NOTE_COUNT);
  const note = pitch % NOTE_COUNT;

  let closestScaleNote = note;
  let minDistance = NOTE_COUNT;

  for (const scaleNote of Array.from(scalePattern)) {
    const distance = Math.abs(scaleNote - note);
    if (distance < minDistance) {
      minDistance = distance;
      closestScaleNote = scaleNote;
    }
  }

  return octave * NOTE_COUNT + closestScaleNote;
};

// Helper function to snap a tick to the grid based on time signature
const snapToGrid = (tick: number, pianoRollSnap: TimeSignature): number => {
  const snapTicks = getTicksForTimeSignature(pianoRollSnap);
  return Math.round(tick / snapTicks) * snapTicks;
};

export const DraggableNote: React.FC<DraggableNoteProps> = ({
  noteEvent,
  x,
  y,
  width,
  height,
  isChord,
}) => {
  const { onEventMove } = usePianoRoll();
  const pianoRollSnap = usePianoRollSelector((s) => s.pianoRollSnap);
  const noteRef = useRef<HTMLDivElement>(null);
  // TODO: Pass from parent instead of calculating
  const parentRef = useRef<HTMLElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const { scalePattern } = useScaleContext();

  // Common function to handle both mouse and touch move events
  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragStartRef.current || !noteRef.current) {
        return;
      }

      const dx = clientX - dragStartRef.current.x;
      const dy = clientY - dragStartRef.current.y;

      let newX = x + dx;
      let newY = y + dy;

      // Constrain movement within the piano roll
      newX = Math.max(0, Math.min(newX, TOTAL_WIDTH - width));
      newY = Math.max(0, Math.min(newY, TOTAL_HEIGHT - height));

      // Snap to grid
      const newTick = snapToGrid(
        Math.round(newX / PIXELS_PER_TICK),
        pianoRollSnap
      );
      newX = newTick * PIXELS_PER_TICK;

      // Calculate the new pitch by inverting the y-axis
      const totalNotes = Math.floor(TOTAL_HEIGHT / NOTE_HEIGHT);
      let newPitch = totalNotes - 1 - Math.floor(newY / NOTE_HEIGHT);

      // Snap to scale
      newPitch = snapToScale(newPitch, scalePattern);

      // Convert pitch back to y coordinate
      newY = (totalNotes - 1 - newPitch) * NOTE_HEIGHT;

      noteRef.current.style.transform = `translate(${newX - x}px, ${
        newY - y
      }px)`;
    },
    [x, y, width, height, scalePattern, pianoRollSnap]
  );

  // Common function to handle both mouse and touch end events
  const handleEnd = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragStartRef.current || !noteRef.current) {
        return;
      }

      const dx = clientX - dragStartRef.current.x;
      const dy = clientY - dragStartRef.current.y;

      const newX = x + dx;
      const newY = y + dy;

      // Snap to grid
      const newTick = Math.max(
        0,
        snapToGrid(Math.round(newX / PIXELS_PER_TICK), pianoRollSnap)
      );

      // Calculate the new pitch by inverting the y-axis
      const totalNotes = Math.floor(TOTAL_HEIGHT / NOTE_HEIGHT);
      let newPitch = totalNotes - 1 - Math.floor(newY / NOTE_HEIGHT);

      // Snap to scale
      newPitch = snapToScale(newPitch, scalePattern);

      const octaveNote = calculateOctaveNote(newPitch);

      onEventMove(noteEvent.id, newTick, octaveNote);

      noteRef.current.style.transform = "";
      dragStartRef.current = null;

      // Remove the class that disables overflow
      if (parentRef.current) {
        parentRef.current.classList.remove("overflow-hidden");
      }

      // Remove all event listeners
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    },
    [noteEvent, x, y, onEventMove, scalePattern, pianoRollSnap]
  );

  // Mouse-specific move handler
  const handleMouseMove = useCallback(
    (e: MouseEvent) => handleMove(e.clientX, e.clientY),
    [handleMove]
  );

  // Mouse-specific end handler
  const handleMouseUp = useCallback(
    (e: MouseEvent) => handleEnd(e.clientX, e.clientY),
    [handleEnd]
  );

  // Touch-specific move handler
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      e.preventDefault(); // Prevent scrolling while dragging
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    },
    [handleMove]
  );

  // Touch-specific end handler
  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      handleEnd(touch.clientX, touch.clientY);
    },
    [handleEnd]
  );

  // Common function to handle both mouse and touch start events
  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      playChordOrNote(noteEvent);
      dragStartRef.current = { x: clientX, y: clientY };

      // Find the parent element with overflow
      if (!parentRef.current) {
        parentRef.current =
          noteRef.current?.closest(
            ".overflow-auto, .overflow-scroll, .overflow-hidden"
          ) ?? null;
      }

      // Add a class to disable overflow
      if (parentRef.current) {
        parentRef.current.classList.add("overflow-hidden");
      }

      // Add event listeners for both mouse and touch events
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);
    },
    [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd, noteEvent]
  );

  // Mouse-specific start handler
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      handleStart(e.clientX, e.clientY);
    },
    [handleStart]
  );

  // Touch-specific start handler
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      e.preventDefault(); // Prevent mouse events from also firing
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    },
    [handleStart]
  );

  // Clean up event listeners on component unmount
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);

      // Remove the class that disables overflow
      if (parentRef.current) {
        parentRef.current.classList.remove("overflow-hidden");
      }
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  return (
    <div
      ref={noteRef}
      className={`absolute flex items-center justify-start border cursor-move pl-1 ${
        isChord ? "bg-blue-500" : "bg-green-500"
      }`}
      style={{
        left: x,
        top: y,
        width,
        height,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <span className="text-white text-xs">
        {getChordOrNoteText(noteEvent)}
      </span>
    </div>
  );
};
