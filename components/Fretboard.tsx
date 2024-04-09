import React from "react";
import { Image, ImageRequireSource, View } from "react-native";
import { useSelector } from "react-redux";
import { NoteCount } from "../engine/generateNeckRepresentation";
import { Skin, selectControlPanel } from "../store/controlPanelSlice";
import { tw } from "../tailwind";
import { Fretline } from "./Fretline";

const getDimensionsForSkin = (skin?: Skin) => {
  switch (skin) {
    case Skin.PRS_SE_AX20E:
    case undefined:
      return {
        top: -543,
      };
    case Skin.Ibanez_AE140_WKH:
      return {
        top: -549,
        left: -88,
      };
    case Skin.Yamaha_CSF3M:
      return {
        top: -533,
        left: -9,
      };
    case Skin.Yamaha_SLG200NW:
      return {
        top: -527,
        left: -65,
      };
  }
};

export interface FretboardProps {
  scaleFactor: number;
  imageSource: ImageRequireSource;
  onImageLoaded?: () => void;
  isCollapsed?: boolean;
}

export const Fretboard: React.FC<FretboardProps> = ({
  scaleFactor,
  imageSource,
  onImageLoaded,
  isCollapsed = false,
}) => {
  const { neck, selectedSkin } = useSelector(selectControlPanel);

  if (!neck) {
    return null;
  }

  const dimensions = getDimensionsForSkin(selectedSkin);

  return (
    <View
      style={[
        tw`mt-24 mb-24`,
        {
          transform: [{ scale: scaleFactor }],
          transformOrigin: "top left",
          opacity: isCollapsed ? 0 : 1,
        },
      ]}
    >
      <View
        style={[
          tw`items-start z-10`,
          {
            left: 456,
          },
        ]}
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
        <View style={tw`mt-20`}>
          {neck.map((row, rowIndex) => (
            <Fretline string={rowIndex} key={rowIndex} elements={row} />
          ))}
        </View>
      </View>
      <Image
        style={[
          tw`absolute`,
          dimensions,
          {
            width: 5504,
            height: 2200,
            transform: [
              { scale: 0.662 }, // Scale the image to fit the Fretboard class
            ],
            transformOrigin: "top left",
          },
        ]}
        onLoad={onImageLoaded}
        source={imageSource}
      ></Image>
    </View>
  );
};
