import { NOTE_COUNT, OctaveNote } from "@/app/data/notes";
import {
  NOTE_HEIGHT,
  PIXELS_PER_TICK,
  TOTAL_HEIGHT,
  TOTAL_WIDTH,
} from "@/app/data/pianoRollConstants";
import React, { useCallback, useEffect, useRef } from "react";

interface DraggableNoteProps {
  noteId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isChord: boolean;
  onNoteMove: (noteId: string, newTick: number, newPitch: OctaveNote) => void;
}

const calculateOctaveNote = (pitch: number): OctaveNote => {
  const octave = Math.floor(pitch / NOTE_COUNT);
  const note = pitch % NOTE_COUNT;
  return { octave, note };
};

export const DraggableNote: React.FC<DraggableNoteProps> = ({
  noteId,
  x,
  y,
  width,
  height,
  isChord,
  onNoteMove,
}) => {
  const noteRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragStartRef.current || !noteRef.current) return;

      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      let newX = x + dx;
      let newY = y + dy;

      // Constrain movement within the piano roll
      newX = Math.max(0, Math.min(newX, TOTAL_WIDTH - width));
      newY = Math.max(0, Math.min(newY, TOTAL_HEIGHT - height));

      // Snap to grid
      newX = Math.round(newX / PIXELS_PER_TICK) * PIXELS_PER_TICK;
      newY = Math.round(newY / NOTE_HEIGHT) * NOTE_HEIGHT;

      noteRef.current.style.transform = `translate(${newX - x}px, ${
        newY - y
      }px)`;
    },
    [x, y, width, height]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (!dragStartRef.current || !noteRef.current) return;

      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      let newX = x + dx;
      let newY = y + dy;

      // Snap to grid
      newX = Math.round(newX / PIXELS_PER_TICK) * PIXELS_PER_TICK;
      newY = Math.round(newY / NOTE_HEIGHT) * NOTE_HEIGHT;

      const newTick = Math.round(newX / PIXELS_PER_TICK);

      // Calculate the new pitch by inverting the y-axis
      const totalNotes = Math.floor(TOTAL_HEIGHT / NOTE_HEIGHT);
      const newPitch = totalNotes - 1 - Math.floor(newY / NOTE_HEIGHT);

      const octaveNote = calculateOctaveNote(newPitch);
      onNoteMove(noteId, newTick, octaveNote);

      noteRef.current.style.transform = "";
      dragStartRef.current = null;

      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    },
    [noteId, x, y, onNoteMove, handleMouseMove]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      dragStartRef.current = { x: e.clientX, y: e.clientY };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [handleMouseMove, handleMouseUp]
  );

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={noteRef}
      className="absolute cursor-move"
      style={{
        left: x,
        top: y,
        width,
        height,
        backgroundColor: isChord ? "#3b82f6" : "#22c55e",
        border: "1px solid #d1d5db",
      }}
      onMouseDown={handleMouseDown}
    />
  );
};
