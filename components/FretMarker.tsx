import React from "react";
import { Pressable, Text, View } from "react-native";
import { Note, OctaveNote, getNoteText } from "../data/notes";
import { ShowNoteMode } from "../data/showNoteMode";
import { playNote } from "../engine/soundProvider";
import tw from "../tailwind";

interface FretMarkerProps {
  fret: number;
  width: number;
  top: number;
  octaveNote: OctaveNote | undefined;
  isHeader?: boolean;
  baseNote: Note;
  showNoteMode: ShowNoteMode;
}

export const FretMarker: React.FC<FretMarkerProps> = ({
  fret,
  width,
  top,
  octaveNote,
  isHeader,
  baseNote,
  showNoteMode,
}) => {
  const isInScale: boolean = octaveNote !== undefined;
  const note: Note | undefined = octaveNote?.note;
  const circleWidth: string = isHeader ? "w-12 h-12" : "w-7 h-7";
  const bg: string = note === baseNote ? "bg-orange-500" : "bg-orange-100";
  const color: string = note === baseNote ? "text-black" : "text-red-500";

  return (
    <View
      style={[
        tw`relative flex justify-center items-center pt-1 pb-1`,
        { width, top },
        fret > 0 && tw`border-l-2 border-red-500`,
      ]}
    >
      <Text
        style={[
          tw`p-2 w-2 h-2 flex justify-center items-center`,
          {
            opacity: isInScale ? 100 : 0,
          },
        ]}
      >
        {octaveNote !== undefined && (
          <Pressable
            disabled={isHeader}
            onPress={() => {
              playNote(octaveNote);
            }}
            style={tw`bg-transparent p-2 ${circleWidth} flex justify-center items-center rounded-full ${bg} border-slate-800 border-2`}
          >
            <Text
              selectable={false}
              style={tw`${color} text-${isHeader ? "2xl" : "md"} font-mono`}
            >
              {isHeader
                ? note
                : showNoteMode === ShowNoteMode.Note
                ? getNoteText(octaveNote.note) + octaveNote.octave
                : fret}
            </Text>
          </Pressable>
        )}
      </Text>
    </View>
  );
};
