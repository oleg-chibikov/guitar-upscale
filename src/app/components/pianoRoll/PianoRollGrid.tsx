import { BEATS_IN_BAR } from "@/app/data/clockConstants";
import { isSharp, NOTE_COUNT, OctaveNote } from "@/app/data/notes";
import {
  BEAT_WIDTH,
  NOTE_HEIGHT,
  TOTAL_WIDTH,
} from "@/app/data/pianoRollConstants";
import React, { useEffect, useRef } from "react";

interface PianoRollGridProps {
  width: number;
  height: number;
}

export const PianoRollGrid: React.FC<PianoRollGridProps> = ({
  width,
  height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    renderPianoRollBackground(ctx);
    renderGrid(ctx);
  }, [width, height]);

  const renderPianoRollBackground = (ctx: CanvasRenderingContext2D) => {
    for (let octave = 0; octave <= 8; octave++) {
      for (let note = 0; note < NOTE_COUNT; note++) {
        const yPosition = getPitchPosition({ octave, note });

        ctx.fillStyle = !isSharp(note) ? "#f3f4f6" : "#d1d5db";
        ctx.fillRect(0, yPosition, width, NOTE_HEIGHT);

        ctx.beginPath();
        ctx.moveTo(0, yPosition);
        ctx.lineTo(width, yPosition);
        ctx.strokeStyle = "#9ca3af";
        ctx.stroke();
      }
    }
  };

  const renderGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = "#9ca3af";

    for (let bar = 0; bar < TOTAL_WIDTH / (BEAT_WIDTH * BEATS_IN_BAR); bar++) {
      for (let beat = 0; beat < BEATS_IN_BAR; beat++) {
        const xPosition = (bar * BEATS_IN_BAR + beat) * BEAT_WIDTH;
        ctx.beginPath();
        ctx.moveTo(xPosition, 0);
        ctx.lineTo(xPosition, height);
        ctx.lineWidth = beat === 0 ? 2 : 1;
        ctx.stroke();
      }
    }
  };

  return <canvas ref={canvasRef} className="absolute left-0 top-0" />;
};

const getPitchPosition = (octaveNote: OctaveNote): number => {
  const { octave, note } = octaveNote;
  const octavePosition = octave * NOTE_COUNT * NOTE_HEIGHT;
  const notePosition = note * NOTE_HEIGHT;
  return octavePosition + notePosition;
};
