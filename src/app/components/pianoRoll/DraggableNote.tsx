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
  onNoteMove: (noteId: string, newTick: number, newPitch: number) => void;
}

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
  const dragInfoRef = useRef<{
    startX: number;
    startY: number;
    originalLeft: number;
    originalTop: number;
  } | null>(null);
  const isDraggingRef = useRef(false);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current || !dragInfoRef.current || !noteRef.current)
        return;

      const { startX, startY, originalLeft, originalTop } = dragInfoRef.current;
      const element = noteRef.current;

      let newLeft = e.clientX - startX;
      let newTop = e.clientY - startY;

      // Constrain movement within the piano roll
      newLeft = Math.max(0, Math.min(newLeft, TOTAL_WIDTH - width));
      newTop = Math.max(0, Math.min(newTop, TOTAL_HEIGHT - height));

      // Snap to grid
      newLeft = Math.round(newLeft / PIXELS_PER_TICK) * PIXELS_PER_TICK;
      newTop = Math.round(newTop / NOTE_HEIGHT) * NOTE_HEIGHT;

      element.style.transform = `translate(${newLeft - originalLeft}px, ${
        newTop - originalTop
      }px)`;
    },
    [width, height]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current || !dragInfoRef.current || !noteRef.current)
      return;

    const element = noteRef.current;
    const transform = element.style.transform;
    const matches = transform.match(
      /translate\((-?\d+(?:\.\d+)?)px, (-?\d+(?:\.\d+)?)px\)/
    );

    if (matches) {
      const dx = parseFloat(matches[1]);
      const dy = parseFloat(matches[2]);

      const newLeft = x + dx;
      const newTop = y + dy;

      const newTick = Math.round(newLeft / PIXELS_PER_TICK);
      const newPitch = Math.round(newTop / NOTE_HEIGHT);

      onNoteMove(noteId, newTick, newPitch);
    }

    element.style.zIndex = "";
    element.style.transform = "";
    dragInfoRef.current = null;
    isDraggingRef.current = false;

    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }, [noteId, x, y, onNoteMove, handleMouseMove]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const element = noteRef.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      dragInfoRef.current = {
        startX: e.clientX - rect.left,
        startY: e.clientY - rect.top,
        originalLeft: rect.left,
        originalTop: rect.top,
      };
      element.style.zIndex = "10";
      isDraggingRef.current = true;

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
