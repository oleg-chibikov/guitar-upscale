import React, { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";
import { useSelector } from "react-redux";
import { NoteDisplayMode } from "../data/noteDisplayMode";
import {
  Note,
  StringOctaveNote,
  getNoteText,
  serializeStringOctaveNote,
} from "../data/notes";
import { NoteMap, NotePlayEventBus } from "../engine/eventBus";
import { sleep } from "../engine/sleep";
import { playNote } from "../engine/soundProvider";
import { mouseAvailable } from "../helpers/mouseAvailable";
import { selectControlPanel, velocityValue } from "../store/controlPanelSlice";
import { tw } from "../tailwind";

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
  const {
    velocity,
    selectedBaseNote,
    selectedNoteDisplayMode,
    neck,
    chordStrummingDelayMs,
  } = useSelector(selectControlPanel);

  const hasMouseInput = mouseAvailable();

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
      const key = serializeStringOctaveNote(stringOctaveNote);
      NoteMap.set(key, () => {
        console.log("Playing note (auto): " + JSON.stringify(stringOctaveNote));
        playNoteAndAnimate();
      });
      return () => {
        NoteMap.delete(key);
      };
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

  const handlePress = async () => {
    if (isHeader) {
      if (!neck) {
        return;
      }

      console.log("Playing all the notes on fret " + fret);
      for (let stringIndex = 0; stringIndex < neck.length; stringIndex++) {
        const string = neck[stringIndex];
        const note = string[fret];
        if (note) {
          NotePlayEventBus.next({ ...note, string: stringIndex });
          await sleep(chordStrummingDelayMs);
        }
      }

      return;
    }
    console.log("Playing note (manual): " + JSON.stringify(stringOctaveNote));
    playNoteAndAnimate();
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
          <View
            style={[
              tw`bg-transparent flex justify-center items-center border-slate-100 border-opacity-30 border-2`,
              {
                cursor: "pointer",
                width,
                paddingVertical: 2,
              },
            ]}
            onTouchStart={async () => {
              // using onTouchStart on a View supports multiouch (play chords), while the other methods don't seem to support
              if (!hasMouseInput) {
                // this event handler is only for touch devices
                await handlePress();
              }
            }}
            onStartShouldSetResponder={() => {
              if (hasMouseInput) {
                // this event handler is only for mouse devices
                handlePress();
              }
              return true;
            }} // Capture both touch and mouse events
          >
            <View
              style={tw`p-2 flex justify-center ${circleWidth} items-center rounded-full ${bg} border-slate-800 border-2`}
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
            </View>
          </View>
        )}
      </Text>
    </View>
  );
};
