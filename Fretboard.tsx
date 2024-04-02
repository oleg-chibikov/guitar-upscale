import React from "react";
import { Image, ImageRequireSource, View } from "react-native";
import { Fretline } from "./Fretline";
import { Note } from "./data/notes";
import { ShowNoteMode } from "./data/showNoteMode";
import { Neck, NoteCount } from "./generateNeckRepresentation";
import tw from "./tailwind";

export interface FretboardProps {
  scaleFactor: number;
  imageSource: ImageRequireSource;
  onImageLoaded?: () => void;
  neck: Neck;
  baseNote: Note;
  showNoteMode: ShowNoteMode;
  isCollapsed?: boolean;
}

export const Fretboard: React.FC<FretboardProps> = ({
  scaleFactor,
  imageSource,
  neck,
  onImageLoaded,
  baseNote,
  showNoteMode,
  isCollapsed = false,
}) => (
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
        showNoteMode={ShowNoteMode.Fret}
        baseNote={baseNote}
        elements={Array.from({ length: NoteCount * 2 + 1 }, (_, index) => ({
          note: index,
          octave: 4,
        }))}
      />
      {/* Notes */}
      <View style={tw`mt-20`}>
        {neck.map((row, rowIndex) => (
          <Fretline
            showNoteMode={showNoteMode}
            string={rowIndex}
            key={rowIndex}
            elements={row}
            baseNote={baseNote}
          />
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
