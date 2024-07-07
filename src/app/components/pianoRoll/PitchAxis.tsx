import { isSharp, Note } from "@/app/data/notes";
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
  width?: number;
  showNoteLabels?: boolean;
}

export const PitchAxis = forwardRef<HTMLCanvasElement, PitchAxisProps>(
  ({ width = 64, className, showNoteLabels = true }, ref) => {
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
              (OCTAVE_COUNT - 1 - octave) * 12 * NOTE_HEIGHT +
              noteIndex * NOTE_HEIGHT;
            const noteKey = `${Note[note]}${octave}`;

            ctx.fillStyle = isSharp(note) ? "#000000" : "#FFFFFF";
            if (pressedNotes.has(noteKey)) {
              ctx.fillStyle = isSharp(note) ? "#333333" : "#CCCCCC";
            }
            ctx.fillRect(0, y, width, NOTE_HEIGHT);

            ctx.strokeStyle = "#D1D5DB";
            ctx.strokeRect(0, y, width, NOTE_HEIGHT);

            if (showNoteLabels && note === Note.C) {
              ctx.fillStyle = "#666666";
              ctx.font = "12px Arial";
              ctx.fillText(getNoteLabel(note, octave), 4, y + NOTE_HEIGHT - 4);
            }
          });
        });
      };

      drawPitchAxis();
    }, [ref, octaves, width, showNoteLabels, pressedNotes]);

    return (
      <canvas
        ref={ref}
        className={`${className} pitch-axis`}
        width={width}
        height={OCTAVE_COUNT * 12 * NOTE_HEIGHT}
        onClick={(e) => {
          const canvas = ref instanceof Function ? null : ref?.current;
          if (!canvas) return;

          const rect = canvas.getBoundingClientRect();
          const y = e.clientY - rect.top;
          const octaveIndex = Math.floor(y / (12 * NOTE_HEIGHT));
          const noteIndex = Math.floor((y % (12 * NOTE_HEIGHT)) / NOTE_HEIGHT);
          const octave = OCTAVE_COUNT - 1 - octaveIndex;
          const note = allNotes[noteIndex];
          handleNotePress({ octave, note });
        }}
      />
    );
  }
);

PitchAxis.displayName = "PitchAxis";
