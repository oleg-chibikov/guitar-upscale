import { NoteDisplayMode } from "@/app/data/noteDisplayMode";
import {
  StringOctaveNote,
  getNoteText,
  serializeStringOctaveNote,
} from "@/app/data/notes";
import { Theme } from "@/app/data/theme";
import { getCurrentRelativeTick } from "@/app/engine/clock/mainClock";
import {
  ClearNoteMetadata,
  NoteMetadata,
  NotePlayEventBus,
  NoteToFretMarkerEventMap,
} from "@/app/engine/eventBus";
import { NOTE_COUNT } from "@/app/engine/generateNeckRepresentation";
import { sleep } from "@/app/helpers/sleep";
import { useInputChecker } from "@/app/hooks/useInputChecker";
import {
  baseNoteValue,
  chordIsBeingDetectedValue,
  chordStrummingDelayMsValue,
  scaleIsBeingDetectedValue,
  selectSettings,
} from "@/app/store/settingsSlice";
import { selectUi, themeValue } from "@/app/store/uiSlice";
import { Typography } from "@mui/material";
import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

const coloredHeaders = new Set<number>([0, 3, 5, 7, 9, 12, 15, 17, 19, 21, 24]);

interface FretMarkerProps {
  fret: number;
  width: number;
  top: number;
  stringOctaveNote: StringOctaveNote | null;
  isHeader: boolean;
}
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

const getColorClass = (trackNumber: number | undefined, theme: Theme) => {
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
  const typographyRef = useRef<HTMLParagraphElement>(null);
  const blastRef = useRef<HTMLDivElement>(null);
  const { neck } = useSelector(selectSettings);
  const { noteDisplayMode, fretboardScaleX, fretboardScaleY, theme } =
    useSelector(selectUi);

  const hasTouchInput = useInputChecker();
  const isFromPreviousChordRef = useRef<boolean>(false);
  const isChordBeingDetectedRef = useRef<boolean>(false);
  const isScaleBeingDetectedRef = useRef<boolean>(false);
  const trackNumberRef = useRef<number>();

  const dispatch = useDispatch();

  const toggleBlastAnimationColor = () => {
    const blastElement = blastRef.current;
    if (!blastElement) {
      return;
    }
    const classList = blastElement.classList;

    classList.remove(...lightColors.concat(darkColors));
    classList.add(getColorClass(trackNumberRef.current, theme));
  };

  const setTrackNumber = (noteMetadata: NoteMetadata) => {
    if (
      noteMetadata.looperChannel !== undefined ||
      noteMetadata.trackNumber !== undefined
    ) {
      trackNumberRef.current =
        noteMetadata.looperChannel ?? noteMetadata.trackNumber;
    } else if (noteMetadata.fromChord === true) {
      trackNumberRef.current = 5;
    }
  };

  const resetTrackNumber = () => {
    // reset color after the note has finished animation
    trackNumberRef.current = undefined;
  };

  const toggleClasses = () => {
    const typographyElement = typographyRef.current;
    if (!typographyElement) {
      return;
    }
    const classList = typographyElement.classList;
    classList.remove(
      "border-4",
      "shadow-glow",
      "border-chord_detection-light",
      "shadow-chord_detection_glow-light",
      "border-chord_detection-dark",
      "shadow-chord_detection_glow-dark",
      "border-scale_detection-light",
      "shadow-scale_detection_glow-light",
      "border-scale_detection-dark",
      "shadow-scale_detection_glow-dark",
      "border-accent_stronger-light",
      "border-accent_stronger-dark",
      "border-accent_strongest-light",
      "border-accent_strongest-dark",
      "text-background-light",
      "text-background-dark",
      "text-foreground-light",
      "text-foreground-dark",
      "bg-previous_fret_marker_match-light",
      "bg-previous_fret_marker_match-dark",
      "bg-previous_fret_marker-light",
      "bg-previous_fret_marker-dark",
      "bg-disabled_match-light",
      "bg-disabled_match-dark",
      "bg-fret_marker_match-light",
      "bg-fret_marker_match-dark",
      "bg-disabled-light",
      "bg-disabled-dark",
      "bg-fret_marker-light",
      "bg-fret_marker-dark"
    );

    if (
      isChordBeingDetectedRef.current ||
      isScaleBeingDetectedRef.current ||
      isFromPreviousChordRef.current
    ) {
      classList.add("border-4");
    }

    if (isChordBeingDetectedRef.current || isScaleBeingDetectedRef.current) {
      classList.add("shadow-glow");
      if (isChordBeingDetectedRef.current) {
        if (themeValue === Theme.Light) {
          classList.add(
            "border-chord_detection-light",
            "shadow-chord_detection_glow-light"
          );
        } else {
          classList.add(
            "border-chord_detection-dark",
            "shadow-chord_detection_glow-dark"
          );
        }
      } else if (isScaleBeingDetectedRef.current) {
        if (themeValue === Theme.Light) {
          classList.add(
            "border-scale_detection-light",
            "shadow-scale_detection_glow-light"
          );
        } else {
          classList.add(
            "border-scale_detection-dark",
            "shadow-scale_detection_glow-dark"
          );
        }
      }
    } else if (isFromPreviousChordRef.current) {
      // only if chord and scale are not being detected
      classList.add(
        themeValue === Theme.Light
          ? "border-accent_strongest-light"
          : "border-accent_strongest-dark"
      );
    }

    if (isFromPreviousChordRef.current) {
      classList.add(
        themeValue === Theme.Light
          ? "text-background-light"
          : "text-background-dark"
      );
      if (isColored) {
        classList.add(
          themeValue === Theme.Light
            ? "bg-previous_fret_marker_match-light"
            : "bg-previous_fret_marker_match-dark"
        );
      } else {
        classList.add(
          themeValue === Theme.Light
            ? "bg-previous_fret_marker-light"
            : "bg-previous_fret_marker-dark"
        );
      }
    } else {
      classList.add(
        themeValue === Theme.Light
          ? "text-foreground-light"
          : "text-foreground-dark"
      );

      if (isColored) {
        if (isBehindCapo) {
          classList.add(
            themeValue === Theme.Light
              ? "bg-disabled_match-light"
              : "bg-disabled_match-dark"
          );
        } else {
          classList.add(
            theme === Theme.Light
              ? "bg-fret_marker_match-light"
              : "bg-fret_marker_match-dark"
          );
        }
      } else {
        if (isBehindCapo) {
          classList.add(
            themeValue === Theme.Light
              ? "bg-disabled-light"
              : "bg-disabled-dark"
          );
        } else {
          classList.add(
            theme === Theme.Light
              ? "bg-fret_marker-light"
              : "bg-fret_marker-dark"
          );
        }
      }
    }
  };

  useEffect(toggleClasses, [theme, neck]);

  useEffect(() => {
    // Function to play note and start animation
    const animate = () => {
      if (!(stringOctaveNote && typographyRef.current)) {
        return;
      }
      typographyRef.current.classList.remove(
        "fret-note-circle-animation-light",
        "fret-note-circle-animation-dark"
      );
      void typographyRef.current.offsetWidth; // trigger reflow
      typographyRef.current.classList.add(
        "fret-note-circle-animation-" +
          (themeValue === Theme.Light ? "light" : "dark")
      );
      if (!blastRef.current) {
        return;
      }
      blastRef.current.classList.add("hidden");
      void blastRef.current.offsetWidth; // trigger reflow
      blastRef.current.classList.remove("hidden");
    };

    if (stringOctaveNote) {
      const key = serializeStringOctaveNote(stringOctaveNote);
      NoteToFretMarkerEventMap.set(key, async (metadata) => {
        try {
          if ((metadata as ClearNoteMetadata).clearChordMarker === true) {
            isFromPreviousChordRef.current = false;
            return;
          }
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
            isChordBeingDetectedRef.current = true;
            chordDetectorBuilder.addNote({
              stringOctaveNote,
              clear: () => {
                isChordBeingDetectedRef.current = false;
                toggleClasses();
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
            isScaleBeingDetectedRef.current = true;
            scaleDetectorBuilder.addNote({
              stringOctaveNote,
              clear: () => {
                isScaleBeingDetectedRef.current = false;
                toggleClasses();
              },
            });
          }

          // it may come from several tracks for the same note simultaneously
          setTrackNumber(noteMetadata);
          toggleBlastAnimationColor();

          if (noteMetadata.fromChord === true) {
            isFromPreviousChordRef.current = true;
          }
          animate();
        } finally {
          toggleClasses();
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
    onTouchStartCapture: async () => {
      if (stringOctaveNote && hasTouchInput) {
        await handlePress();
      }
    },
    onMouseDownCapture: async () => {
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
            className={`flex justify-center items-center font-mono contain-content
                      ${
                        isHeader
                          ? `text-xl ${
                              theme === Theme.Light
                                ? "text-foreground-light"
                                : "text-foreground-dark"
                            }`
                          : "text-md rounded-full w-7 h-7"
                      }`}
            ref={typographyRef}
            style={{
              transform: `scaleX(${fretboardScaleX}) scaleY(${fretboardScaleY})`,
            }}
          >
            {getMarkerText(stringOctaveNote)}
          </Typography>
          {/* Clickable area */}
          <div
            className="absolute contain-content cursor-pointer z-20 bg-transparent h-9"
            style={{ width }}
            {...clickAttrs}
          />
          {
            // Blast animation element
            <div
              ref={blastRef}
              style={{
                width: `${5 * fretboardScaleX}px`, // Set width based on fretboard scaling
                height: `${5 * fretboardScaleY}px`, // Set height based on fretboard scaling
              }}
              onAnimationEnd={() => {
                resetTrackNumber();
                toggleBlastAnimationColor();
              }}
              className="opacity-0 contain-content animate-blast absolute z-10 rounded-full hidden"
            />
          }
        </>
      )}
    </div>
  );
};
