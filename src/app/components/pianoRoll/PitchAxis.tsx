import { isSharp, Note } from "@/app/data/notes";
import { WithClassName } from "@/app/helpers/withClassName";
import { Typography } from "@mui/material";
import React from "react";

const OCTAVE_COUNT = 9; // 0-8 octaves
export const NOTE_HEIGHT = 20; // Should match the NOTE_HEIGHT in getPitchPosition
export const allNotes = Object.values(Note)
  .filter((note): note is Note => typeof note === "number")
  .reverse();
export const TOTAL_HEIGHT = NOTE_HEIGHT * allNotes.length * OCTAVE_COUNT;

interface PitchAxisProps extends WithClassName {
  darkNoteColor?: string;
  lightNoteColor?: string;
  noteBorderColor?: string;
  width?: number;
  showNoteLabels?: boolean;
}

export const PitchAxis: React.FC<PitchAxisProps> = ({
  darkNoteColor = "bg-black",
  lightNoteColor = "bg-white",
  noteBorderColor = "border-gray-300",
  width,
  className,
  showNoteLabels = true,
}) => {
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
};
