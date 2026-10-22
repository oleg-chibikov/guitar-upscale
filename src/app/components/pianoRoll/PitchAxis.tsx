import { useBaseNoteContext } from "@/app/context/BaseNoteProvider";
import { isSharp, serializeOctaveNote } from "@/app/data/notes";
import { PITCH_AXIS_WIDTH, PITCH_COUNT } from "@/app/data/pianoRollConstants";
import { playNote } from "@/app/engine/sound/soundProvider";
import { fromPitch, pitchToY, Zoom } from "@/app/engine/pianoRoll/geometry";
import { WithClassName } from "@/app/helpers/withClassName";
import React, { memo, useEffect, useRef, useState } from "react";

interface PitchAxisProps extends WithClassName {
  zoom: Zoom;
  // pitches that sound right now, lit on the keys
  activePitches?: ReadonlySet<number>;
}

const BLACK_WIDTH = PITCH_AXIS_WIDTH * 0.6;
const PRESS_HIGHLIGHT_MS = 200;
// tall canvases past this size fail on mobile Safari
const MAX_CANVAS_PIXELS = 16_000_000;

const PitchAxisComponent: React.FC<PitchAxisProps> = ({
  className,
  zoom,
  activePitches,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pressedPitch, setPressedPitch] = useState<number | undefined>();
  const { baseNote } = useBaseNoteContext();
  const height = PITCH_COUNT * zoom.noteHeight;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(
      window.devicePixelRatio || 1,
      Math.sqrt(MAX_CANVAS_PIXELS / (PITCH_AXIS_WIDTH * height))
    );
    canvas.width = Math.floor(PITCH_AXIS_WIDTH * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const h = zoom.noteHeight;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, PITCH_AXIS_WIDTH, height);
    ctx.strokeStyle = "#D1D5DB";
    ctx.lineWidth = 1;

    for (let pitch = 0; pitch < PITCH_COUNT; pitch++) {
      const y = pitchToY(pitch, zoom);
      const octaveNote = fromPitch(pitch);
      const sharp = isSharp(octaveNote.note);
      const lit = pressedPitch === pitch || activePitches?.has(pitch) === true;

      if (sharp) {
        ctx.fillStyle = lit ? "#4b5563" : "#000000";
        ctx.fillRect(0, y, BLACK_WIDTH, h);
      } else {
        if (lit) {
          ctx.fillStyle = "#bfdbfe";
          ctx.fillRect(0, y, PITCH_AXIS_WIDTH, h);
        }
        // a white key edge only where two white keys meet
        if (!isSharp(fromPitch(pitch + 1).note)) {
          ctx.beginPath();
          ctx.moveTo(0, y + 0.5);
          ctx.lineTo(PITCH_AXIS_WIDTH, y + 0.5);
          ctx.stroke();
        }
      }

      if (h >= 10) {
        const isBaseNote = octaveNote.note === baseNote;
        ctx.fillStyle = sharp ? "#9CA3AF" : isBaseNote ? "#000000" : "#6B7280";
        ctx.font = `${isBaseNote ? "bold " : ""}${Math.min(11, h - 4)}px Arial`;
        ctx.textBaseline = "middle";
        ctx.fillText(
          serializeOctaveNote(octaveNote),
          sharp ? 4 : BLACK_WIDTH + 6,
          y + h / 2
        );
      }
    }
  }, [zoom, height, baseNote, pressedPitch, activePitches]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rowPitch = PITCH_COUNT - 1 - Math.floor(y / zoom.noteHeight);
    let pitch = rowPitch;
    // the right part of a black key row belongs to the white key under it
    if (isSharp(fromPitch(rowPitch).note) && x > BLACK_WIDTH) {
      const inUpperHalf = y % zoom.noteHeight < zoom.noteHeight / 2;
      pitch = inUpperHalf ? rowPitch + 1 : rowPitch - 1;
    }
    void playNote(fromPitch(pitch));
    setPressedPitch(pitch);
    setTimeout(() => setPressedPitch(undefined), PRESS_HIGHLIGHT_MS);
  };

  return (
    <canvas
      ref={canvasRef}
      className={`${className ?? ""} cursor-pointer block`}
      style={{ width: PITCH_AXIS_WIDTH, height }}
      onPointerDown={handlePointerDown}
    />
  );
};

export const PitchAxis = memo(PitchAxisComponent);
