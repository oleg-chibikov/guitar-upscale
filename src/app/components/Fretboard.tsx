import Image from "next/image";
import React from "react";
import { useSelector } from "react-redux";
import { NoteCount } from "../engine/generateNeckRepresentation";
import { Skin, selectControlPanel } from "../store/controlPanelSlice";
import { Fretline } from "./Fretline";

const getDimensionsForSkin = (skin?: Skin) => {
  switch (skin) {
    case Skin.PRS_SE_AX20E:
    case undefined:
      return {
        top: -583,
      };
    case Skin.Ibanez_AE140_WKH:
      return {
        top: -589,
        left: -88,
      };
    case Skin.Yamaha_CSF3M:
      return {
        top: -573,
        left: -9,
      };
    case Skin.Yamaha_SLG200NW:
      return {
        top: -567,
        left: -65,
      };
  }
};

export interface FretboardProps {
  scaleFactor: number;
  imageSource: string;
  onImageLoaded?: () => void;
  isCollapsed?: boolean;
}

export const Fretboard: React.FC<FretboardProps> = ({
  scaleFactor,
  imageSource,
  onImageLoaded,
  isCollapsed = false,
}) => {
  const { neck, skin, fretboardScaleX, fretboardScaleY, mainBg } =
    useSelector(selectControlPanel);

  if (!neck) {
    return null;
  }

  const dimensions = getDimensionsForSkin(skin);

  return (
    <div
      className="mt-24 mb-24 origin-top-left"
      style={{
        transform: `scale(${scaleFactor}) scaleX(${
          1 / fretboardScaleX
        }) scaleY(${1 / fretboardScaleY})`,
        opacity: isCollapsed ? 0 : 1,
      }}
    >
      <div
        className={"items-start z-10"}
        style={{
          left: 456,
        }}
      >
        {/* Header */}
        <Fretline
          isHeader
          elements={Array.from({ length: NoteCount * 2 + 1 }, (_, index) => ({
            note: index,
            octave: 4,
            string: 0,
            fret: index,
          }))}
        />
        {/* Notes */}
        <div className="mt-10">
          {neck.map((row, rowIndex) => (
            <Fretline string={rowIndex} key={rowIndex} elements={row} />
          ))}
        </div>
      </div>
      <Image
        className={`absolute ${mainBg} origin-top-left`}
        style={{
          ...dimensions,
          width: 5504,
          height: 2200,
          transform: "scale(0.662)", // Scale the image to fit the Fretboard class
        }}
        onLoad={onImageLoaded}
        src={imageSource}
        alt="Guitar"
      />
    </div>
  );
};
