import React from "react";
import { useSelector } from "react-redux";
import { StringOctaveNote } from "../../data/notes";
import { NOTE_COUNT } from "../../engine/generateNeckRepresentation";
import { Skin, selectControlPanel } from "../../store/controlPanelSlice";
import { FretMarker } from "./FretMarker";

export interface FretlineProps {
  elements: (StringOctaveNote | null)[];
  string?: number;
  isHeader?: boolean;
}

const calculateTop = (string: number, fret: number, modifiers: number[]) => {
  switch (string) {
    case 0:
      return -(fret * 0.4 * modifiers[0]);
    case 1:
      return -(fret * 0.3 * modifiers[1]);
    case 2:
      return -(fret * 0.2 * modifiers[2]);
    case 3:
      return fret * -0.1 * modifiers[3];
    case 4:
      return fret * 0.2 * modifiers[4];
    case 5:
      return fret * 0.3 * modifiers[5];
    default:
      return 0;
  }
};

const getParametersForSkin = (skin?: Skin) => {
  switch (skin) {
    case Skin.PRS_SE_AX20E:
    default:
      return {
        height: 25,
        widthStep: 10.25,
        stringTiltModifiers: [3.2, 3, 2, 1, 2, 2.5],
      };
    case Skin.Ibanez_AE140_WKH:
      return {
        height: 27,
        widthStep: 10.2,
        stringTiltModifiers: [2.5, 2.2, 2, 1, 2, 2.5],
      };
    case Skin.Yamaha_CSF3M:
      return {
        height: 29,
        widthStep: 10.56,
        stringTiltModifiers: [2.5, 2, 1.1, -2, 2.2, 3],
      };
    case Skin.Yamaha_SLG200NW:
      return {
        height: 30,
        widthStep: 10.85,
        stringTiltModifiers: [2.5, 2, 1.1, -2, 2.2, 3],
      };
  }
};

export const Fretline: React.FC<FretlineProps> = ({
  elements,
  string,
  isHeader,
}) => {
  const { skin } = useSelector(selectControlPanel);

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
