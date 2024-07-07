import { isSharp, Note, NOTE_COUNT } from "@/app/data/notes";
import {
  allNotes,
  NOTE_HEIGHT,
  OCTAVE_COUNT,
} from "@/app/data/pianoRollConstants";
import { playNote } from "@/app/engine/sound/soundProvider";
import { WithClassName } from "@/app/helpers/withClassName";
import { forwardRef, useEffect, useState } from "react";

export type OctaveNote = {
  octave: number;
  note: Note;
};

interface PitchAxisProps extends WithClassName {
  showNoteLabels?: boolean;
}

const WIDTH = 112;
const BLACK_WIDTH = WIDTH * 0.6;

const HALF_HEIGHT = NOTE_HEIGHT * 0.5;
const HEIGHT_AND_HALF = NOTE_HEIGHT * 1.5;

export const PitchAxis = forwardRef<HTMLCanvasElement, PitchAxisProps>(
  ({ className, showNoteLabels = true }, ref) => {
    const [pressedNotes, setPressedNotes] = useState<Set<string>>(new Set());

    const octaves = Array.from({ length: OCTAVE_COUNT }, (_, i) => i);

    const getNoteLabel = (note: Note, octave: number): string => {
      return `${Note[note]}${octave}`;
    };

    const handleNotePress = (octaveNote: OctaveNote) => {
      const noteKey = `${Note[octaveNote.note]}${octaveNote.octave}`;
      void playNote(octaveNote);
      setPressedNotes(new Set(pressedNotes.add(noteKey)));
      setTimeout(() => {
        setPressedNotes((prev) => {
          const newSet = new Set(prev);
          newSet.delete(noteKey);
          return newSet;
        });
      }, 200);
    };

    useEffect(() => {
      const canvas = ref instanceof Function ? null : ref?.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const drawPitchAxis = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        octaves.forEach((octave) => {
          allNotes.forEach((note, noteIndex) => {
            const y =
              (OCTAVE_COUNT - 1 - octave) * NOTE_COUNT * NOTE_HEIGHT +
              noteIndex * NOTE_HEIGHT;
            const noteKey = `${Note[note]}${octave}`;

            if (isSharp(note)) {
              // Draw sharp notes
              ctx.fillStyle = pressedNotes.has(noteKey) ? "#333333" : "#000000";
              ctx.fillRect(0, y, BLACK_WIDTH, NOTE_HEIGHT);
              ctx.strokeStyle = "#D1D5DB";
              ctx.strokeRect(0, y, BLACK_WIDTH, NOTE_HEIGHT);
            } else {
              // Draw white notes
              ctx.fillStyle = pressedNotes.has(noteKey) ? "#CCCCCC" : "#FFFFFF";
              ctx.beginPath();
              ctx.moveTo(0, y);
              if (noteIndex > 0 && isSharp(allNotes[noteIndex - 1])) {
                ctx.lineTo(BLACK_WIDTH, y);
                ctx.lineTo(BLACK_WIDTH, y - HALF_HEIGHT);
                ctx.lineTo(WIDTH, y - HALF_HEIGHT);
                ctx.lineTo(WIDTH, y + NOTE_HEIGHT);
              } else {
                ctx.lineTo(WIDTH, y);
                ctx.lineTo(WIDTH, y + NOTE_HEIGHT);
              }
              if (
                noteIndex < allNotes.length - 1 &&
                isSharp(allNotes[noteIndex + 1])
              ) {
                ctx.lineTo(WIDTH, y + HEIGHT_AND_HALF);
                ctx.lineTo(BLACK_WIDTH, y + HEIGHT_AND_HALF);
                ctx.lineTo(BLACK_WIDTH, y + NOTE_HEIGHT);
              }
              ctx.lineTo(0, y + NOTE_HEIGHT);
              ctx.closePath();
              ctx.fill();

              // Stroke the entire white note area
              ctx.strokeStyle = "#D1D5DB";
              ctx.stroke();
            }

            if (showNoteLabels && note === Note.C) {
              ctx.fillStyle = "#666666";
              ctx.font = "NOTE_COUNTpx Arial";
              ctx.fillText(getNoteLabel(note, octave), 4, y + NOTE_HEIGHT - 4);
            }
          });
        });
      };

      drawPitchAxis();
    }, [ref, octaves, showNoteLabels, pressedNotes]);

    const getClickedNote = (x: number, y: number): OctaveNote | null => {
      const octaveIndex = Math.floor(y / (NOTE_COUNT * NOTE_HEIGHT));
      const noteIndex = Math.floor(
        (y % (NOTE_COUNT * NOTE_HEIGHT)) / NOTE_HEIGHT
      );
      const octave = OCTAVE_COUNT - 1 - octaveIndex;
      const note = allNotes[noteIndex];
      const isInFirstHalf = y % NOTE_HEIGHT < NOTE_HEIGHT / 2;

      // Check if the click is on a black key first
      if (isSharp(note)) {
        if (x <= BLACK_WIDTH) {
          return { octave, note };
        } else {
          if (isInFirstHalf && noteIndex > 0) {
            return { octave, note: allNotes[noteIndex - 1] };
          }
          if (noteIndex < allNotes.length - 1) {
            // If click is to the right of the black key, return null
            return { octave, note: allNotes[noteIndex + 1] };
          }
        }
      }

      // If it's a white key or left of a black key, return the note
      return { octave, note };
    };

    return (
      <canvas
        ref={ref}
        className={`${className} pitch-axis cursor-pointer`}
        width={WIDTH}
        height={OCTAVE_COUNT * NOTE_COUNT * NOTE_HEIGHT}
        onClick={(e) => {
          const canvas = ref instanceof Function ? null : ref?.current;
          if (!canvas) return;

          const rect = canvas.getBoundingClientRect();
          const y = e.clientY - rect.top;
          const x = e.clientX - rect.left;

          const clickedNote = getClickedNote(x, y);
          if (clickedNote) {
            handleNotePress(clickedNote);
          }
        }}
      />
    );
  }
);

PitchAxis.displayName = "PitchAxis";
