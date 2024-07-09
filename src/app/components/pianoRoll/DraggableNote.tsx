import { usePianoRoll } from "@/app/context/PianoRollProvider";
import { useScaleContext } from "@/app/context/ScaleProvider";
import { Note, NOTE_COUNT, OctaveNote } from "@/app/data/notes";
import {
  NOTE_HEIGHT,
  PIXELS_PER_TICK,
  TOTAL_HEIGHT,
  TOTAL_WIDTH,
} from "@/app/data/pianoRollConstants";
import { ChordOrNote, getChordOrNoteText } from "@/app/engine/eventsByTick";
import { playChordOrNote } from "@/app/engine/playerHelper";
import React, { useCallback, useEffect, useRef } from "react";

interface DraggableNoteProps {
  noteEvent: ChordOrNote;
  x: number;
  y: number;
  width: number;
  height: number;
  isChord: boolean;
}

const calculateOctaveNote = (pitch: number): OctaveNote => {
  const octave = Math.floor(pitch / NOTE_COUNT);
  const note = pitch % NOTE_COUNT;
  return { octave, note };
};

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

export const DraggableNote: React.FC<DraggableNoteProps> = ({
  noteEvent,
  x,
  y,
  width,
  height,
  isChord,
}) => {
  const { onEventMove } = usePianoRoll();
  const noteRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const { scalePattern } = useScaleContext();

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
    [x, y, width, height, scalePattern]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (!dragStartRef.current || !noteRef.current) {
        return;
      }

      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      let newX = x + dx;
      const newY = y + dy;

      // Snap to grid
      newX = Math.round(newX / PIXELS_PER_TICK) * PIXELS_PER_TICK;

      const newTick = Math.max(Math.round(newX / PIXELS_PER_TICK), 0);

      // Calculate the new pitch by inverting the y-axis
      const totalNotes = Math.floor(TOTAL_HEIGHT / NOTE_HEIGHT);
      let newPitch = totalNotes - 1 - Math.floor(newY / NOTE_HEIGHT);

      // Snap to scale
      newPitch = snapToScale(newPitch, scalePattern);

      const octaveNote = calculateOctaveNote(newPitch);

      onEventMove(noteEvent.id, newTick, octaveNote);

      noteRef.current.style.transform = "";
      dragStartRef.current = null;

      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    },
    [noteEvent, x, y, onEventMove, handleMouseMove, scalePattern]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      playChordOrNote(noteEvent);
      dragStartRef.current = { x: e.clientX, y: e.clientY };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [handleMouseMove, handleMouseUp, noteEvent]
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
    >
      <span className="text-white text-xs">
        {getChordOrNoteText(noteEvent)}
      </span>
    </div>
  );
};
