import { NOTE_COUNT, StringOctaveNote } from "@/app/data/notes";
import { getParametersForSkin } from "@/app/helpers/skinHelper";
import { useUiSelector } from "@/app/hooks/storeHooks";
import React from "react";
import { FretMarker } from "./FretMarker";

export interface FretlineProps {
  elements: (StringOctaveNote | null)[];
  string?: number;
  isHeader: boolean;
}

const calculateTop = (string: number, fret: number, modifiers: number[]) => {
  if (string < 0 || string >= modifiers.length) {
    return 0;
  }

  const baseMultipliers = [-0.4, -0.3, -0.2, -0.1, 0.2, 0.3, 0.35, 0.5];
  const multiplier =
    string < baseMultipliers.length ? baseMultipliers[string] : 0.3;

  return fret * multiplier * modifiers[string];
};

export const Fretline: React.FC<FretlineProps> = ({
  elements,
  string,
  isHeader,
}) => {
  const skin = useUiSelector((s) => s.skin);

  const { widthStep, height, stringTiltModifiers } = getParametersForSkin(skin);
  const widthFactor = 1.06;
  const initialWidth = (NOTE_COUNT + 1) * widthStep; // Initial width for the first fret

  return (
    <div
      className={`flex flex-row justify-between items-center`}
      style={{ height }}
    >
      {elements.map((stringOctaveNote, fret) => {
        const width = initialWidth / Math.pow(widthFactor, fret);
        let top = 0;
        if (string !== undefined) {
          top = calculateTop(string, fret, stringTiltModifiers);
        }

        return (
          <FretMarker
            key={fret}
            fret={fret}
            width={width}
            isHeader={isHeader}
            top={top}
            stringOctaveNote={stringOctaveNote}
          />
        );
      })}
    </div>
  );
};
