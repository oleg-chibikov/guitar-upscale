import { BEATS_IN_BAR } from "@/app/data/clockConstants";
import { isSharp, Note } from "@/app/data/notes";
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
  scalePattern: Set<Note>;
}

export const PianoRollGrid: React.FC<PianoRollGridProps> = ({
  width,
  height,
  scalePattern,
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
  }, [width, height, scalePattern]);

  const renderPianoRollBackground = (ctx: CanvasRenderingContext2D) => {
    octaves.forEach((octave) => {
      allNotes.forEach((note) => {
        const yPosition = getPitchPosition({ octave, note });
        const isInScale = scalePattern.has(note);

        // Use different colors for in-scale and out-of-scale notes
        if (isInScale) {
          ctx.fillStyle = isSharp(note) ? "#263238" : "#37474f"; // blue-grey-900 for white keys, blue-grey-800 for black keys
        } else {
          ctx.fillStyle = "#546e7a"; // Darker shades for out-of-scale notes
        }
        ctx.fillRect(0, yPosition, TOTAL_WIDTH, NOTE_HEIGHT);

        // Draw horizontal line
        ctx.beginPath();
        ctx.moveTo(0, yPosition);
        ctx.lineTo(TOTAL_WIDTH, yPosition);
        // ctx.strokeStyle = "#546e7a";
        // ctx.stroke();
      });
    });
  };

  const renderGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = "#546e7a"; // blue-grey-600

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
