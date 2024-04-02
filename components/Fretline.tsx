import React from "react";
import { View } from "react-native";
import { Note, OctaveNote } from "../data/notes";
import { ShowNoteMode } from "../data/showNoteMode";
import { NoteCount } from "../engine/generateNeckRepresentation";
import tw from "../tailwind";
import { FretMarker } from "./FretMarker";

const calculateTop = (string: number, fret: number) => {
  switch (string) {
    case 0:
      return -(fret * 0.4 * 4);
    case 1:
      return -(fret * 0.3 * 3);
    case 2:
      return -(fret * 0.2 * 2);
    case 3:
      return fret * 0.1 * 2;
    case 4:
      return fret * 0.2 * 3;
    case 5:
      return fret * 0.3 * 4;
    default:
      return 0;
  }
};

export interface FretlineProps {
  elements: (OctaveNote | undefined)[];
  string?: number;
  isHeader?: boolean;
  baseNote: Note;
  showNoteMode: ShowNoteMode;
}

export const Fretline: React.FC<FretlineProps> = ({
  elements,
  string,
  isHeader,
  baseNote,
  showNoteMode,
}) => {
  const widthStep = 10.25; // Width step for each subsequent fret
  const initialWidth = (NoteCount + 1) * widthStep; // Initial width for the first fret
  const widthFactor = 1.06; // Exponential factor for fret width increase

  return (
    <View style={tw`flex-row justify-between items-center`}>
      {elements.map((octaveNote, fret) => {
        const width = initialWidth / Math.pow(widthFactor, fret);
        let top = 0;
        if (string !== undefined) {
          top = calculateTop(string, fret);
        }

        return (
          <FretMarker
            fret={fret}
            width={width}
            isHeader={isHeader}
            top={top}
            octaveNote={octaveNote}
            baseNote={baseNote}
            showNoteMode={showNoteMode}
          />
        );
      })}
    </View>
  );
};
