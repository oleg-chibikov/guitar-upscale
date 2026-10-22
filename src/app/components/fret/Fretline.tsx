import { NOTE_COUNT, StringOctaveNote } from "@/app/data/notes";
import { getParametersForSkin, StringTilt } from "@/app/helpers/skinHelper";
import { useUiSelector } from "@/app/hooks/storeHooks";
import React from "react";
import { FretMarker } from "./FretMarker";

export interface FretlineProps {
  elements: (StringOctaveNote | null)[];
  string?: number;
  isHeader: boolean;
}

const calculateTop = (string: number, x: number, tilt: StringTilt) =>
  x * tilt.slope * (string - tilt.center);

export const Fretline: React.FC<FretlineProps> = ({
  elements,
  string,
  isHeader,
}) => {
  const skin = useUiSelector((s) => s.skin);

  const { widthStep, height, stringTilt } = getParametersForSkin(skin);
  const widthFactor = 1.06;
  const initialWidth = (NOTE_COUNT + 1) * widthStep; // Initial width for the first fret

  return (
    <div
      className={`flex flex-row justify-between items-center`}
      style={{ height }}
    >
      {elements.map((stringOctaveNote, fret) => {
        const width = initialWidth / Math.pow(widthFactor, fret);
        // Each fret is narrower by widthFactor, so the frets before it sum up as a geometric series.
        const left =
          (initialWidth * (1 - Math.pow(widthFactor, -fret))) /
          (1 - 1 / widthFactor);
        const x = left + (width - initialWidth) / 2;
        let top = 0;
        if (string !== undefined) {
          top = calculateTop(string, x, stringTilt);
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
