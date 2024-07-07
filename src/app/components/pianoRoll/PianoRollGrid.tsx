import { BEATS_IN_BAR } from "@/app/data/clockConstants";
import { isSharp } from "@/app/data/notes";
import {
  allNotes,
  BEAT_WIDTH,
  NOTE_HEIGHT,
  octaves,
  TOTAL_WIDTH,
} from "@/app/data/pianoRollConstants";
import { getPitchPosition } from "@/app/helpers/pianoRollHelper";
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
    octaves.forEach((octave) => {
      allNotes.forEach((note) => {
        const yPosition = getPitchPosition({ octave, note });

        ctx.fillStyle = isSharp(note) ? "#37474f" : "#455a64"; // gray-800 for white keys, gray-700 for black keys
        ctx.fillRect(0, yPosition, TOTAL_WIDTH, NOTE_HEIGHT);

        // Draw horizontal line
        ctx.beginPath();
        ctx.moveTo(0, yPosition);
        ctx.lineTo(TOTAL_WIDTH, yPosition);
        // ctx.strokeStyle = "#546e7a"; // gray-600
        //ctx.stroke();
      });
    });
  };

  const renderGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = "#546e7a"; // gray-600

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
