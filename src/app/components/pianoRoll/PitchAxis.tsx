import { isSharp, Note } from "@/app/data/notes";
import {
  allNotes,
  NOTE_HEIGHT,
  OCTAVE_COUNT,
} from "@/app/data/pianoRollConstants";
import { WithClassName } from "@/app/helpers/withClassName";
import { Typography } from "@mui/material";
import { forwardRef } from "react";

interface PitchAxisProps extends WithClassName {
  darkNoteColor?: string;
  lightNoteColor?: string;
  noteBorderColor?: string;
  width?: number;
  showNoteLabels?: boolean;
}

export const PitchAxis = forwardRef<HTMLDivElement, PitchAxisProps>(
  (
    {
      darkNoteColor = "bg-black",
      lightNoteColor = "bg-white",
      noteBorderColor = "border-gray-300",
      width,
      className,
      showNoteLabels = true,
    },
    ref
  ) => {
    const octaves = Array.from(
      { length: OCTAVE_COUNT },
      (_, i) => OCTAVE_COUNT - 1 - i
    );

    const getNoteColor = (note: Note): string => {
      return isSharp(note) ? darkNoteColor : lightNoteColor;
    };

    const getNoteLabel = (note: Note, octave: number): string => {
      return `${Note[note]}${octave}`;
    };

    return (
      <div
        ref={ref}
        className={`${className} w-16 bg-gray-200 border-r border-gray-300`}
        style={width !== undefined ? { width } : undefined}
      >
        {octaves.map((octave) =>
          allNotes.map((note) => (
            <div
              key={`${octave}-${note}`}
              className={`border-b ${noteBorderColor} flex items-center ${getNoteColor(
                note
              )}`}
              style={{
                height: `${NOTE_HEIGHT}px`,
                top: `${
                  (OCTAVE_COUNT - 1 - octave) * 12 * NOTE_HEIGHT +
                  note * NOTE_HEIGHT
                }px`,
              }}
            >
              {showNoteLabels && note === Note.C && (
                <Typography color={"ActiveCaption"} className="pl-1">
                  {getNoteLabel(note, octave)}
                </Typography>
              )}
            </div>
          ))
        )}
      </div>
    );
  }
);

PitchAxis.displayName = "PitchAxis";
