import { NoteDisplayMode } from "@/app/data/noteDisplayMode";
import {
  StringOctaveNote,
  getNoteText,
  serializeStringOctaveNote,
} from "@/app/data/notes";
import { Theme } from "@/app/data/theme";
import {
  ClearNoteMetadata,
  NoteMetadata,
  NotePlayEventBus,
  NoteToFretMarkerEventMap,
} from "@/app/engine/eventBus";
import { NOTE_COUNT } from "@/app/engine/generateNeckRepresentation";
import { getCurrentRelativeTick } from "@/app/engine/mainClock";
import { sleep } from "@/app/helpers/sleep";
import { useInputChecker } from "@/app/hooks/useInputChecker";
import {
  baseNoteValue,
  chordIsBeingDetectedValue,
  chordStrummingDelayMsValue,
  scaleIsBeingDetectedValue,
  selectSettings,
} from "@/app/store/settingsSlice";
import { selectUi } from "@/app/store/uiSlice";
import { Typography } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const coloredHeaders = new Set<number>([0, 3, 5, 7, 9, 12, 15, 17, 19, 21, 24]);

interface FretMarkerProps {
  fret: number;
  width: number;
  top: number;
  stringOctaveNote: StringOctaveNote | null;
  isHeader: boolean;
}

const getColorClass = (trackNumber: number | undefined, theme: Theme) => {
  const lightColors = [
    "bg-amber-400",
    "bg-slate-400",
    "bg-violet-400",
    "bg-fuchsia-400",
    "bg-pink-400",
    "bg-rose-400",
  ];
  const darkColors = [
    "bg-sky-600",
    "bg-teal-600",
    "bg-emerald-600",
    "bg-indigo-600",
    "bg-cyan-600",
    "bg-purple-600",
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
  const { neck } = useSelector(selectSettings);
  const { noteDisplayMode, fretboardScaleX, fretboardScaleY, theme } =
    useSelector(selectUi);

  const hasTouchInput = useInputChecker();
  const [isFromPreviousChord, setIsFromPreviousChord] =
    useState<boolean>(false);
  const [isNoteClicked, setIsNoteClicked] = useState<boolean>(false);
  const trackNumberRef = useRef<number>();
  const [isChordBeingDetected, setIsChordBeingDetected] =
    useState<boolean>(false);
  const [isScaleBeingDetected, setIsScaleBeingDetected] =
    useState<boolean>(false);

  const dispatch = useDispatch();

  useEffect(() => {
    // Function to play note and start animation
    const animate = () => {
      if (stringOctaveNote) {
        setIsNoteClicked(true);
      }
    };

    if (stringOctaveNote) {
      const key = serializeStringOctaveNote(stringOctaveNote);
      NoteToFretMarkerEventMap.set(key, async (metadata) => {
        if ((metadata as ClearNoteMetadata).clearChordMarker === true) {
          setIsFromPreviousChord(false);
        } else {
          const noteMetadata = metadata as NoteMetadata;
          if (
            chordIsBeingDetectedValue &&
            stringOctaveNote !== null &&
            noteMetadata.skipChordDetection !== true
          ) {
            // this module is only loaded when chordIsBeingDetectedValue is true (meaning the chord detection button was pressed)
            const { chordDetectorBuilder } = await import(
              "@/app/engine/chords/chordDetectorBuilder"
            );
            setIsChordBeingDetected(true);
            chordDetectorBuilder.addNote({
              stringOctaveNote: stringOctaveNote,
              clear: () => {
                setIsChordBeingDetected(false);
              },
            });
          }

          if (
            scaleIsBeingDetectedValue &&
            stringOctaveNote !== null &&
            noteMetadata.skipChordDetection !== true
          ) {
            const { scaleDetectorBuilder } = await import(
              "@/app/engine/scales/scaleDetectorBuilder"
            );
            setIsScaleBeingDetected(true);
            scaleDetectorBuilder.addNote({
              stringOctaveNote,
              clear: () => {
                setIsScaleBeingDetected(false);
              },
            });
          }

          // it may come from several tracks for the same note simultaneously
          if (
            noteMetadata.looperChannel !== undefined ||
            noteMetadata.trackNumber !== undefined
          ) {
            trackNumberRef.current =
              noteMetadata.looperChannel ?? noteMetadata.trackNumber;
          } else if (noteMetadata.fromChord === true) {
            trackNumberRef.current = 5; // another color for chords
          }

          animate();
          if (noteMetadata.fromChord === true) {
            setIsFromPreviousChord(true);
          }
        }
      });
      return () => {
        NoteToFretMarkerEventMap.delete(key);
      };
    }
    return;
  }, [dispatch, stringOctaveNote]);

  const getMarkerText = (stringOctaveNote: StringOctaveNote) => {
    if (isHeader) {
      return stringOctaveNote.note;
    }
    // always show Note for the 0 fret (open string)
    const displayMode =
      stringOctaveNote.fret === 0 ? NoteDisplayMode.Note : noteDisplayMode;
    switch (displayMode) {
      case NoteDisplayMode.Note:
        return getNoteText(stringOctaveNote.note) + stringOctaveNote.octave;
      case NoteDisplayMode.Note_Shift: {
        const result = (stringOctaveNote.note - baseNoteValue) % NOTE_COUNT;
        return result >= 0 ? result : result + NOTE_COUNT;
      }
      default:
        return fret;
    }
  };

  const isColored =
    (isHeader &&
      stringOctaveNote &&
      coloredHeaders.has(stringOctaveNote?.fret)) ||
    stringOctaveNote?.note === baseNoteValue;

  const handlePress = async () => {
    if (isHeader) {
      if (!neck) {
        return;
      }
      console.log(
        "Playing all the notes on fret at tick %d",
        fret,
        getCurrentRelativeTick()
      );
      for (let stringIndex = 0; stringIndex < neck.length; stringIndex++) {
        const string = neck[stringIndex];
        const stringOctaveNote = string[fret];
        if (stringOctaveNote) {
          NotePlayEventBus.next({
            stringOctaveNote,
          });
          await sleep(chordStrummingDelayMsValue);
        }
      }
      return;
    }
    console.log(
      "Playing note (manual) %o at tick %d",
      stringOctaveNote,
      getCurrentRelativeTick()
    );
    if (stringOctaveNote) {
      NotePlayEventBus.next({
        stringOctaveNote,
      });
    }
  };

  const clickAttrs = {
    onTouchStart: async () => {
      if (stringOctaveNote && hasTouchInput) {
        await handlePress();
      }
    },
    onMouseDown: async () => {
      if (stringOctaveNote && !hasTouchInput) {
        await handlePress();
      }
    },
  };

  const isBehindCapo = fret < baseNoteValue;

  return (
    // Space for the marker - it's drawn even if the marker is not present for the current scale
    <div
      className={`
            flex relative justify-center items-center h-5 pt-1 pb-1
            ${
              fret > 0
                ? `border-l-2 ${
                    theme === Theme.Light
                      ? "border-border-light"
                      : "border-border-dark"
                  }`
                : ""
            }
            ${
              isHeader
                ? "h-9 " +
                  (isColored
                    ? isBehindCapo
                      ? theme === Theme.Light
                        ? "bg-disabled_match-light"
                        : "bg-disabled_match-dark"
                      : theme === Theme.Light
                      ? "bg-fret_marker_match-light"
                      : "bg-fret_marker_match-dark"
                    : isBehindCapo
                    ? theme === Theme.Light
                      ? "bg-disabled-light"
                      : "bg-disabled-dark"
                    : theme === Theme.Light
                    ? "bg-fret_marker-light"
                    : "bg-fret_marker-dark")
                : ""
            }
            `}
      style={{ width, top }}
    >
      {stringOctaveNote && (
        <>
          {/* The marker itself */}
          <Typography
            variant="body2"
            className={`flex justify-center items-center select-none font-mono
${isHeader ? "" : "rounded-full w-7 h-7"}
${
  isChordBeingDetected
    ? `border-4 shadow-glow ${
        theme === Theme.Light
          ? "border-chord_detection-light shadow-chord_detection_glow-light"
          : "border-chord_detection-dark shadow-chord_detection_glow-dark"
      }`
    : ""
}
${
  isScaleBeingDetected
    ? `border-4 shadow-glow ${
        theme === Theme.Light
          ? "border-scale_detection-light shadow-scale_detection_glow-light"
          : "border-scale_detection-dark shadow-scale_detection_glow-dark"
      }`
    : ""
}
${
  !isHeader
    ? isFromPreviousChord
      ? `
${theme === Theme.Light ? "text-background-light" : "text-background-dark"}
${
  isChordBeingDetected
    ? ""
    : `border-4 ${
        theme === Theme.Light
          ? "border-accent_stronger-light"
          : "border-accent_stronger-dark"
      }`
}
${
  isScaleBeingDetected
    ? ""
    : `border-4 ${
        theme === Theme.Light
          ? "border-accent_strongest-light"
          : "border-accent_strongest-dark"
      }`
}
${
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
        }
${
  isColored
    ? isBehindCapo
      ? theme === Theme.Light
        ? "bg-disabled_match-light"
        : "bg-disabled_match-dark"
      : theme === Theme.Light
      ? "bg-fret_marker_match-light"
      : "bg-fret_marker_match-dark"
    : isBehindCapo
    ? theme === Theme.Light
      ? "bg-disabled-light"
      : "bg-disabled-dark"
    : theme === Theme.Light
    ? "bg-fret_marker-light"
    : "bg-fret_marker-dark"
}`
    : ""
}
${isHeader ? "text-xl" : "text-md"}
${
  isHeader
    ? theme === Theme.Light
      ? "text-foreground-light"
      : "text-foreground-dark"
    : ""
}
${
  isNoteClicked
    ? "fret-note-circle-animation-" + (theme === Theme.Light ? "light" : "dark")
    : ""
}`}
            style={{
              transform: `scaleX(${fretboardScaleX}) scaleY(${fretboardScaleY})`,
            }}
          >
            {getMarkerText(stringOctaveNote)}
          </Typography>
          {/* Clickable area */}
          <div
            className="absolute cursor-pointer z-20 bg-transparent h-9"
            style={{ width }}
            {...clickAttrs}
          />
          {isNoteClicked && (
            // Blast animation element
            <div
              key={Date.now()} // Use a unique key to trigger re-render and start animation
              style={{
                width: `${5 * fretboardScaleX}px`, // Set width based on fretboard scaling
                height: `${5 * fretboardScaleY}px`, // Set height based on fretboard scaling
              }}
              onAnimationEnd={() => {
                setIsNoteClicked(false);
                trackNumberRef.current = undefined; // reset color after the note has finished animation
              }}
              className={`${getColorClass(
                trackNumberRef.current,
                theme
              )} opacity-0 animate-blast absolute z-10 rounded-full`}
            />
          )}
        </>
      )}
    </div>
  );
};
