import { Theme } from "@/app/data/theme";
import { selectUi } from "@/app/store/uiSlice";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { NoteDisplayMode } from "../../data/noteDisplayMode";
import {
  StringOctaveNote,
  getNoteText,
  serializeStringOctaveNote,
} from "../../data/notes";
import {
  ClearNoteMetadata,
  NoteMetadata,
  NotePlayEventBus,
  NoteToFretMarkerEventMap,
} from "../../engine/eventBus";
import { sleep } from "../../engine/sleep";
import { useInputChecker } from "../../helpers/useInputChecker";
import { selectSettings } from "../../store/settingsSlice";

const coloredHeaders = new Set<number>([0, 3, 5, 7, 9, 12, 15, 17, 19, 21, 24]);

interface FretMarkerProps {
  fret: number;
  width: number;
  top: number;
  stringOctaveNote: StringOctaveNote | null;
  isHeader?: boolean;
}

const getColorClass = (trackNumber: number | undefined, theme: Theme) => {
  const lightColors = [
    "bg-amber-400",
    "bg-green-400",
    "bg-lime-400",
    "bg-blue-400",
    "bg-violet-400",
    "bg-pink-400",
  ];
  const darkColors = [
    "bg-sky-600",
    "bg-rose-600",
    "bg-indigo-600",
    "bg-fuchsia-600",
    "bg-cyan-600",
    "bg-emerald-600",
  ];

  const colorIndex = (trackNumber ?? 0) % lightColors.length; // Map trackNumber to index in the colors array
  const colorClass =
    theme === Theme.Light ? lightColors[colorIndex] : darkColors[colorIndex];
  return colorClass;
};

export const FretMarker: React.FC<FretMarkerProps> = ({
  fret,
  width,
  top,
  stringOctaveNote,
  isHeader,
}) => {
  const { neck, chordStrummingDelayMs, baseNote } = useSelector(selectSettings);
  const { noteDisplayMode, fretboardScaleX, fretboardScaleY, theme } =
    useSelector(selectUi);

  const hasTouchInput = useInputChecker();
  const [isFromPreviousChord, setIsFromPreviousChord] =
    useState<boolean>(false);
  const [isNoteClicked, setIsNoteClicked] = useState<boolean>(false);
  const trackNumberRef = useRef<number>();

  useEffect(() => {
    // Function to play note and start animation
    const animate = () => {
      if (stringOctaveNote) {
        setIsNoteClicked(true);
        setTimeout(() => {
          setIsNoteClicked(false);
        }, 300); // Adjust the duration of the animation as needed
      }
    };

    if (stringOctaveNote) {
      const key = serializeStringOctaveNote(stringOctaveNote);
      NoteToFretMarkerEventMap.set(key, (metadata) => {
        if ((metadata as ClearNoteMetadata).clearChordMarker) {
          setIsFromPreviousChord(false);
        } else {
          const noteMetadata = metadata as NoteMetadata;

          // it may come from several tracks for the same note simutaneously
          if (noteMetadata.trackInstrument) {
            trackNumberRef.current = noteMetadata.trackNumber;
          } else if (noteMetadata.fromChord) {
            trackNumberRef.current = 5; // another color for chords
          }

          animate();
          if (noteMetadata.fromChord) {
            setIsFromPreviousChord(true);
          }
        }
      });
      return () => {
        NoteToFretMarkerEventMap.delete(key);
      };
    }
    return;
  }, [stringOctaveNote]);

  const isColored =
    (isHeader &&
      stringOctaveNote &&
      coloredHeaders.has(stringOctaveNote?.fret)) ||
    stringOctaveNote?.note === baseNote;

  const handlePress = async () => {
    if (isHeader) {
      if (!neck) {
        return;
      }
      console.log("Playing all the notes on fret " + fret);
      for (let stringIndex = 0; stringIndex < neck.length; stringIndex++) {
        const string = neck[stringIndex];
        const stringOctaveNote = string[fret];
        if (stringOctaveNote) {
          NotePlayEventBus.next({
            stringOctaveNote,
            fromChord: false,
          });
          await sleep(chordStrummingDelayMs);
        }
      }
      return;
    }
    console.log("Playing note (manual): " + JSON.stringify(stringOctaveNote));
    if (stringOctaveNote) {
      NotePlayEventBus.next({
        stringOctaveNote,
        fromChord: false,
      });
    }
  };

  const clickAttrs = {
    onTouchStart: async () => {
      if (stringOctaveNote && hasTouchInput) {
        await handlePress();
      }
    },
    onMouseDown: () => {
      if (stringOctaveNote && !hasTouchInput) {
        handlePress();
      }
    },
  };

  return (
    // Space for the marker - it's drawn even if the marker is not present for the current scale
    <div
      className={`
            flex relative justify-center items-center h-5 pt-1 pb-1
            ${
              fret > 0 &&
              `border-l-2 ${
                theme === Theme.Light
                  ? "border-border-light"
                  : "border-border-dark"
              }`
            }
            ${
              isHeader &&
              "h-9 " +
                (isColored
                  ? theme === Theme.Light
                    ? "bg-fret_marker_match-light"
                    : "bg-fret_marker_match-dark"
                  : theme === Theme.Light
                  ? "bg-fret_marker-light"
                  : "bg-fret_marker-dark")
            }
            `}
      style={{ width, top }}
    >
      {stringOctaveNote && (
        <>
          {/* The marker itself */}
          <span
            className={`flex justify-center items-center select-none font-mono
                    ${!isHeader && "rounded-full w-7 h-7"}
                    ${
                      !isHeader &&
                      (isFromPreviousChord
                        ? `border-4 ${
                            theme === Theme.Light
                              ? "text-background-light border-border_accent-light"
                              : "text-background-dark border-border_accent-dark"
                          } ${
                            isColored
                              ? `${
                                  theme === Theme.Light
                                    ? "bg-previous_fret_marker_match-light"
                                    : "bg-previous_fret_marker_match-dark"
                                }`
                              : `${
                                  theme === Theme.Light
                                    ? "bg-previous_fret_marker-light"
                                    : "bg-previous_fret_marker-dark"
                                }`
                          }`
                        : `${
                            theme === Theme.Light
                              ? "text-foreground-light"
                              : "text-foreground-dark"
                          } ${
                            isColored
                              ? theme === Theme.Light
                                ? "bg-fret_marker_match-light"
                                : "bg-fret_marker_match-dark"
                              : theme === Theme.Light
                              ? "bg-fret_marker-light"
                              : "bg-fret_marker-dark"
                          }`)
                    }
                    ${isHeader ? "text-xl" : "text-md"}
                    ${
                      isHeader &&
                      (theme === Theme.Light
                        ? "text-foreground-light"
                        : "text-foreground-dark")
                    }
                    ${
                      isNoteClicked
                        ? "fret-note-circle-animation-" +
                          (theme === Theme.Light ? "light" : "dark")
                        : ""
                    }`}
            style={{
              transform: `scaleX(${fretboardScaleX}) scaleY(${fretboardScaleY})`,
            }}
          >
            {isHeader
              ? stringOctaveNote.note
              : noteDisplayMode === NoteDisplayMode.Note
              ? getNoteText(stringOctaveNote.note) + stringOctaveNote.octave
              : fret}
          </span>
          {/* Clickable area */}
          <div
            className="absolute cursor-pointer z-20 bg-transparent h-9"
            style={{ width }}
            {...clickAttrs}
          />
          {isNoteClicked && (
            <div
              key={Date.now()} // Use a unique key to trigger re-render and start animation
              style={{
                width: `${5 * fretboardScaleX}px`, // Set width based on fretboard scaling
                height: `${5 * fretboardScaleY}px`, // Set height based on fretboard scaling
              }}
              className={`${getColorClass(
                trackNumberRef.current,
                theme
              )} animate-blast absolute z-10 rounded-3xl`}
            />
          )}
        </>
      )}
    </div>
  );
};
