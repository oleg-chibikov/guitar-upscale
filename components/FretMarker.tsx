import React, { useEffect, useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { useDispatch } from "react-redux";
import { Note, OctaveNote, getNoteText } from "../data/notes";
import { ShowNoteMode } from "../data/showNoteMode";
import { playNote } from "../engine/soundProvider";
import {
  selectControlPanel,
  setNoteToAnimate,
} from "../store/controlPanelSlice";
import { useAppSelector } from "../store/store";
import tw from "../tailwind";

interface FretMarkerProps {
  fret: number;
  width: number;
  top: number;
  octaveNote: OctaveNote | null;
  isHeader?: boolean;
}

export const FretMarker: React.FC<FretMarkerProps> = ({
  fret,
  width,
  top,
  octaveNote,
  isHeader,
}) => {
  const dispatch = useDispatch();
  const { selectedBaseNote, selectedShowNoteMode, noteToAnimate } =
    useAppSelector(selectControlPanel);

  const isInScale: boolean = octaveNote !== undefined;
  const note: Note | undefined = octaveNote?.note;
  const circleWidth: string = isHeader ? "w-12 h-12" : "w-7 h-7";
  const bg: string =
    note === selectedBaseNote ? "bg-orange-500" : "bg-orange-100";
  const color: string =
    note === selectedBaseNote ? "text-black" : "text-red-500";

  // Animation state
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (noteToAnimate !== null && noteToAnimate === octaveNote) {
      playNoteAndAnimate();
    }
  }, [noteToAnimate]);

  // Function to handle note press
  const handleNotePress = () => {
    if (!isHeader && octaveNote !== null) {
      dispatch(setNoteToAnimate(octaveNote));
    }
  };

  // Function to play note and start animation
  const playNoteAndAnimate = () => {
    if (octaveNote) {
      playNote(octaveNote);
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
        {octaveNote !== null && (
          <Pressable
            disabled={isHeader}
            onPress={handleNotePress}
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
                ? octaveNote.note
                : selectedShowNoteMode === ShowNoteMode.Note
                ? getNoteText(octaveNote.note) + octaveNote.octave
                : fret}
            </Text>
          </Pressable>
        )}
      </Text>
    </View>
  );
};
