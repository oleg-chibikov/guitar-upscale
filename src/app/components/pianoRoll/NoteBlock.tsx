import { RESIZE_HANDLE_PX } from "@/app/data/pianoRollConstants";
import React, { memo } from "react";

export interface NoteBlockProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  isChord: boolean;
  selected: boolean;
  // a copy under the pointer while Alt-dragging, or a note being drawn
  ghost?: boolean;
}

const MIN_LABEL_WIDTH_PX = 18;

const NoteBlockComponent: React.FC<NoteBlockProps> = ({
  id,
  x,
  y,
  width,
  height,
  label,
  isChord,
  selected,
  ghost = false,
}) => {
  const colors = isChord
    ? selected
      ? "bg-sky-300 border-white text-sky-950"
      : "bg-blue-500 border-blue-900 text-white"
    : selected
    ? "bg-lime-300 border-white text-lime-950"
    : "bg-green-600 border-green-950 text-white";
  const showStartHandle = width >= RESIZE_HANDLE_PX * 3;

  return (
    <div
      data-note-id={ghost ? undefined : id}
      className={`absolute flex items-center overflow-hidden rounded-[3px] border touch-none select-none ${colors} ${
        ghost ? "opacity-60 pointer-events-none" : "cursor-move"
      } ${selected ? "z-[2] shadow-[0_0_0_1px_rgba(0,0,0,0.6)]" : "z-[1]"}`}
      style={{
        transform: `translate(${x}px, ${y}px)`,
        width: Math.max(2, width),
        height,
      }}
    >
      {width >= MIN_LABEL_WIDTH_PX && height >= 10 && (
        <span
          className="pl-1 text-[11px] leading-none whitespace-nowrap pointer-events-none"
          style={{ fontSize: Math.min(11, height - 4) }}
        >
          {label}
        </span>
      )}
      {!ghost && showStartHandle && (
        <div
          data-edge="start"
          className="absolute left-0 top-0 h-full cursor-ew-resize"
          style={{ width: RESIZE_HANDLE_PX }}
        />
      )}
      {!ghost && (
        <div
          data-edge="end"
          className="absolute right-0 top-0 h-full cursor-ew-resize"
          style={{ width: Math.min(RESIZE_HANDLE_PX, width / 2) }}
        />
      )}
    </div>
  );
};

export const NoteBlock = memo(NoteBlockComponent);
