import React, { useEffect, useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { NoteDisplayMode } from "../data/noteDisplayMode";
import {
  Note,
  StringOctaveNote,
  getNoteText,
  serizlizeStringOctaveNote,
} from "../data/notes";
import { NoteMap } from "../engine/eventBus";
import { playNote } from "../engine/soundProvider";
import { selectControlPanel, velocityValue } from "../store/controlPanelSlice";
import { useAppSelector } from "../store/store";
import tw from "../tailwind";

interface FretMarkerProps {
  fret: number;
  width: number;
  top: number;
  stringOctaveNote: StringOctaveNote | null;
  isHeader?: boolean;
}

export const FretMarker: React.FC<FretMarkerProps> = ({
  fret,
  width,
  top,
  stringOctaveNote,
  isHeader,
}) => {
  const { velocity, selectedBaseNote, selectedNoteDisplayMode } =
    useAppSelector(selectControlPanel);

  const isInScale: boolean = stringOctaveNote !== undefined;
  const note: Note | undefined = stringOctaveNote?.note;
  const circleWidth: string = isHeader ? "w-12 h-12" : "w-7 h-7";
  const bg: string =
    note === selectedBaseNote ? "bg-orange-500" : "bg-orange-100";
  const color: string =
    note === selectedBaseNote ? "text-black" : "text-red-500";

  // Animation state
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (stringOctaveNote) {
      const key = serizlizeStringOctaveNote(stringOctaveNote);
      NoteMap.set(key, () => {
        console.log("Playing note (auto): " + JSON.stringify(stringOctaveNote));
        playNoteAndAnimate();
      });
      return () => NoteMap.delete(key);
    }
    return () => {};
  }, [stringOctaveNote]);

  // Function to play note and start animation
  const playNoteAndAnimate = () => {
    if (stringOctaveNote) {
      playNote(stringOctaveNote, velocityValue ?? velocity);
    }
    Animated.sequence([
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

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
        {stringOctaveNote !== null && (
          <Pressable
            disabled={isHeader}
            onPress={() => {
              console.log(
                "Playing note (manual): " + JSON.stringify(stringOctaveNote)
              );
              playNoteAndAnimate();
            }}
            style={tw`bg-transparent p-2 ${circleWidth} flex justify-center items-center rounded-full ${bg} border-slate-800 border-2`}
          >
            <Animated.View
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                borderRadius: 9999,
                opacity: glowAnim,
                backgroundColor: "orange", // Change to the desired glow color
                transform: [
                  {
                    scale: glowAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 1.2, 1],
                    }),
                  },
                ],
              }}
            />
            <Text
              selectable={false}
              style={tw`${color} text-${isHeader ? "2xl" : "md"} font-mono`}
            >
              {isHeader
                ? stringOctaveNote.note
                : selectedNoteDisplayMode === NoteDisplayMode.Note
                ? getNoteText(stringOctaveNote.note) + stringOctaveNote.octave
                : fret}
            </Text>
          </Pressable>
        )}
      </Text>
    </View>
  );
};
