import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { NoteDisplayMode } from "../data/noteDisplayMode";
import {
  Note,
  StringOctaveNote,
  getNoteText,
  serializeStringOctaveNote,
} from "../data/notes";
import { NotePlayEventBus, NoteToFretMarkerEventMap } from "../engine/eventBus";
import { sleep } from "../engine/sleep";
import { playNote } from "../engine/soundProvider";
import { useInputChecker } from "../helpers/useInputChecker";
import { selectControlPanel, velocityValue } from "../store/controlPanelSlice";

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
    baseNote,
    noteDisplayMode,
    neck,
    chordStrummingDelayMs,
    fretboardScaleX,
    fretboardScaleY,
    isRecording,
  } = useSelector(selectControlPanel);

  const hasTouchInput = useInputChecker();
  const [isFromPreviousChord, setIsFromPreviousChord] =
    useState<boolean>(false);
  useState<boolean>();

  const isInScale: boolean = stringOctaveNote !== undefined;
  const note: Note | undefined = stringOctaveNote?.note;
  const coloredHeaders = new Set<number>([
    0, 3, 5, 7, 9, 12, 15, 17, 19, 21, 24,
  ]);

  const isColored =
    (isHeader &&
      stringOctaveNote &&
      coloredHeaders.has(stringOctaveNote?.fret)) ||
    note === baseNote;
  const bg: string = isColored
    ? isFromPreviousChord
      ? "bg-lime-500"
      : "bg-orange-400"
    : isFromPreviousChord
    ? "bg-green-500"
    : "bg-orange-100";
  const color: string =
    isFromPreviousChord || isColored ? "text-black" : "text-red-500";

  // Animation state
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (stringOctaveNote) {
      const key = serializeStringOctaveNote(stringOctaveNote);
      NoteToFretMarkerEventMap.set(key, (metadata) => {
        if (metadata.clearChordMarker) {
          // console.log(
          //   "Clearning previous chord marker: " +
          //     JSON.stringify(stringOctaveNote)
          // );
          setIsFromPreviousChord(false);
        } else {
          // console.log(
          //   "Playing note (auto): " + JSON.stringify(stringOctaveNote)
          // );
          playNoteAndAnimate();
          if (metadata.fromChord) {
            // console.log(
            //   "Setting chord marker: " + JSON.stringify(stringOctaveNote)
            // );
            setIsFromPreviousChord(true);
          }
        }
      });
      return () => {
        // TODO: Why deleting handlers here leads to absense of sounds? they should be recreated
        NoteToFretMarkerEventMap.delete(key);
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
        duration: 0,
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
          NotePlayEventBus.next({ note, metadata: { fromChord: false } });
          await sleep(chordStrummingDelayMs);
        }
      }

      return;
    }
    console.log("Playing note (manual): " + JSON.stringify(stringOctaveNote));
    if (stringOctaveNote) {
      NotePlayEventBus.next({
        note: stringOctaveNote,
        metadata: { fromChord: false },
      });
    }
  };
  return (
    <div
      className={`relative flex justify-center items-center pt-1 pb-1 ${
        fret > 0 && "border-l-2 border-red-500"
      }`}
      style={{ width, top }}
    >
      <span
        className="p-2 w-2 h-2 flex justify-center items-center"
        style={{
          opacity: isInScale ? 100 : 0,
        }}
      >
        {stringOctaveNote !== null && (
          <>
            <Animated.View
              style={[
                {
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  borderRadius: 9999,
                  opacity: glowAnim,
                  backgroundColor: "orange", // Change to the desired glow color
                  transform: [
                    {
                      scale: glowAnim.interpolate({
                        inputRange: [0, 0.1, 1],
                        outputRange: [1, 5, 1],
                      }),
                    },
                    {
                      scaleX: fretboardScaleX,
                    },
                    {
                      scaleY: fretboardScaleY,
                    },
                  ],
                },
              ]}
            />
            <div
              className="py-1 pointer bg-transparent flex justify-center items-center border-slate-100 border-opacity-5 border-2"
              style={{
                width,
              }}
              onTouchStart={async () => {
                // using onTouchStart on a View supports multiouch (play chords), while the other methods don't seem to support
                if (hasTouchInput) {
                  // this event handler is only for touch devices
                  await handlePress();
                }
              }}
              onMouseDown={() => {
                if (!hasTouchInput) {
                  // this event handler is only for mouse devices
                  handlePress();
                }
                return true;
              }} // Capture both touch and mouse events
            >
              <div
                style={[
                  tw`p-2 flex justify-center ${
                    isHeader ? "w-9 h-9" : "w-7 h-7"
                  } ${isHeader ? "opacity-75" : ""} items-center ${
                    isHeader ? "" : "rounded-full"
                  } ${
                    isHeader ? "w-full" : ""
                  } ${bg} border-slate-800 border-2`,
                  {
                    transform: !isHeader
                      ? [
                          {
                            scaleX: fretboardScaleX,
                          },
                          {
                            scaleY: fretboardScaleY,
                          },
                        ]
                      : undefined,
                  },
                ]}
              >
                <span
                  selectable={false}
                  style={[
                    tw`${color} text-${isHeader ? "xl" : "md"} font-mono`,
                    {
                      transform: isHeader
                        ? [
                            {
                              scaleX: fretboardScaleX,
                            },
                            {
                              scaleY: fretboardScaleY,
                            },
                          ]
                        : undefined,
                    },
                  ]}
                >
                  {isHeader
                    ? stringOctaveNote.note
                    : noteDisplayMode === NoteDisplayMode.Note
                    ? getNoteText(stringOctaveNote.note) +
                      stringOctaveNote.octave
                    : fret}
                </span>
              </div>
            </div>
          </>
        )}
      </span>
    </div>
  );
};
