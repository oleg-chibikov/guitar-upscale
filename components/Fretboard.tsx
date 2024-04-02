import React from "react";
import { Image, ImageRequireSource, View } from "react-native";
import { NoteCount } from "../engine/generateNeckRepresentation";
import { useAppSelector } from "../store/store";
import tw from "../tailwind";
import { Fretline } from "./Fretline";

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
  const neck = useAppSelector((state) => state.controlPanel.neck);

  if (!neck) {
    return "Loading...";
  }

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
          {
            top: -543,
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
