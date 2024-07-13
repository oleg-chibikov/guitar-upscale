import { MAX_STRING_INDEX_FOR_CHORD_GENERATION } from "@/app/data/chordsGeneratorTypes";
import { NoteDisplayMode } from "@/app/data/noteDisplayMode";
import {
  NOTE_COUNT,
  StringOctaveNote,
  serializeOctaveNote,
  serializeStringOctaveNote,
} from "@/app/data/notes";
import { Theme } from "@/app/data/theme";
import { getShiftedNote } from "@/app/data/tunings";
import { currentTick } from "@/app/engine/clock/mainClock";
import {
  ClearNoteMetadata,
  NoteMetadata,
  NotePlayEventBus,
  NoteToFretMarkerEventMap,
} from "@/app/engine/eventBus";
import {
  darkColors,
  fretMarkerPossibleClasses,
  lightColors,
} from "@/app/helpers/components/fretMarkerPossibleClasses";
import { sleep } from "@/app/helpers/sleep";
import { useSettingsSelector, useUiSelector } from "@/app/hooks/storeHooks";
import { useInputChecker } from "@/app/hooks/useInputChecker";
import {
  capoValue,
  chordIsBeingDetectedValue,
  chordStrummingDelayMsValue,
  scaleIsBeingDetectedValue,
  tuningValue,
} from "@/app/store/settingsSlice";
import { themeValue } from "@/app/store/uiSlice";
import { Typography } from "@mui/material";
import React, { useCallback, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";

const coloredHeaders = new Set<number>([0, 3, 5, 7, 9, 12, 15, 17, 19, 21, 24]);

interface FretMarkerProps {
  fret: number;
  width: number;
  top: number;
  stringOctaveNote: StringOctaveNote | null;
  isHeader: boolean;
}

const getColorClass = (trackNumber: number | undefined) => {
  const colorIndex = (trackNumber ?? 0) % lightColors.length; // Map trackNumber to index in the colors array
  return themeValue === Theme.Light
    ? lightColors[colorIndex]
    : darkColors[colorIndex];
};

const getFingerNameByPosition = (fingerIndex: number) => {
  switch (fingerIndex) {
    case 0:
      return "Index finger";
    case 1:
      return "Middle finger";
    case 2:
      return "Ring finger";
    case 3:
      return "Pinky";
    case 4:
      return "Thumb";
    default:
      throw new Error(`Incorrect finger ${fingerIndex}`);
  }
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
  const neck = useSettingsSelector((s) => s.neck);
  const theme = useUiSelector((s) => s.theme);
  const fretboardScaleX = useUiSelector((s) => s.fretboardScaleX);
  const fretboardScaleY = useUiSelector((s) => s.fretboardScaleY);
  const noteDisplayMode = useUiSelector((s) => s.noteDisplayMode);

  const hasTouchInput = useInputChecker();
  const chordFingerRef = useRef<number | undefined>();
  const isFromPreviousChordRef = useRef<boolean>(false);
  const isChordBeingDetectedRef = useRef<boolean>(false);
  const isScaleBeingDetectedRef = useRef<boolean>(false);
  const blastAnimationColorRef = useRef<string | undefined>();

  const isColored =
    (isHeader &&
      stringOctaveNote &&
      coloredHeaders.has(stringOctaveNote?.fret)) ||
    stringOctaveNote?.note === getShiftedNote(capoValue, tuningValue);
  const isBehindCapo = fret < capoValue;

  const dispatch = useDispatch();

  const setTrackNumber = (noteMetadata: NoteMetadata) => {
    const blastElement = blastRef.current;
    if (!blastElement) {
      return;
    }

    const classList = blastElement.classList;
    let trackNumber: number = 0;
    if (
      noteMetadata.looperChannel !== undefined ||
      noteMetadata.trackNumber !== undefined
    ) {
      trackNumber = noteMetadata.looperChannel ?? noteMetadata.trackNumber ?? 0;
    } else if (noteMetadata.fromChord === true) {
      trackNumber = 5;
    }

    if (blastAnimationColorRef.current !== undefined) {
      classList.remove(blastAnimationColorRef.current);
    }

    const color = getColorClass(trackNumber);
    blastAnimationColorRef.current = color;
    classList.add(color);
  };

  const resetTrackNumber = () => {
    if (blastAnimationColorRef.current === undefined) {
      return;
    }
    const blastElement = blastRef.current;
    if (!blastElement) {
      return;
    }
    const classList = blastElement.classList;
    classList.remove(blastAnimationColorRef.current);

    // reset color after the note has finished animation

    blastAnimationColorRef.current = undefined;
  };

  const toggleClasses = useCallback(() => {
    const typographyElement = typographyRef.current;
    if (!typographyElement) {
      return;
    }

    const neededClasses: string[] = [];

    // Remove existing chord finger badge if it exists
    const existingBadge = typographyElement.previousElementSibling;
    if (existingBadge && existingBadge.classList.contains("badge")) {
      existingBadge.remove();
    }

    if (chordFingerRef.current !== undefined) {
      // Create and add new chord finger badge
      const badgeElement = document.createElement("div");
      badgeElement.className =
        "badge absolute -top-2 z-10 left-1/2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center";
      badgeElement.style.transform = `scaleX(${fretboardScaleX}) scaleY(${fretboardScaleY}) translateX(10px)`;
      badgeElement.style.fontSize = "10px";
      typographyElement.parentElement!.title = getFingerNameByPosition(
        chordFingerRef.current
      );
      badgeElement.textContent = (chordFingerRef.current + 1).toString();

      // Wrap the typography element
      typographyElement.parentNode!.insertBefore(
        badgeElement,
        typographyElement
      );
    } else {
      typographyElement.parentElement!.title = "";
    }

    if (
      isChordBeingDetectedRef.current ||
      isScaleBeingDetectedRef.current ||
      isFromPreviousChordRef.current
    ) {
      neededClasses.push("border-4");
    }

    if (isChordBeingDetectedRef.current || isScaleBeingDetectedRef.current) {
      neededClasses.push("shadow-glow");
      if (isChordBeingDetectedRef.current) {
        if (themeValue === Theme.Light) {
          neededClasses.push(
            "border-chord_detection-light",
            "shadow-chord_detection_glow-light"
          );
        } else {
          neededClasses.push(
            "border-chord_detection-dark",
            "shadow-chord_detection_glow-dark"
          );
        }
      } else if (isScaleBeingDetectedRef.current) {
        if (themeValue === Theme.Light) {
          neededClasses.push(
            "border-scale_detection-light",
            "shadow-scale_detection_glow-light"
          );
        } else {
          neededClasses.push(
            "border-scale_detection-dark",
            "shadow-scale_detection_glow-dark"
          );
        }
      }
    } else if (isFromPreviousChordRef.current) {
      // only if chord and scale are not being detected
      neededClasses.push(
        themeValue === Theme.Light
          ? "border-accent_strongest-light"
          : "border-accent_strongest-dark"
      );
    }

    if (isFromPreviousChordRef.current) {
      neededClasses.push(
        themeValue === Theme.Light
          ? "text-background-light"
          : "text-background-dark"
      );
      if (isColored) {
        neededClasses.push(
          themeValue === Theme.Light
            ? "bg-previous_fret_marker_match-light"
            : "bg-previous_fret_marker_match-dark"
        );
      } else {
        neededClasses.push(
          themeValue === Theme.Light
            ? "bg-previous_fret_marker-light"
            : "bg-previous_fret_marker-dark"
        );
      }
    } else {
      neededClasses.push(
        themeValue === Theme.Light
          ? "text-foreground-light"
          : "text-foreground-dark"
      );

      if (isColored) {
        if (isBehindCapo) {
          neededClasses.push(
            themeValue === Theme.Light
              ? "bg-disabled_match-light"
              : "bg-disabled_match-dark"
          );
        } else {
          neededClasses.push(
            themeValue === Theme.Light
              ? "bg-fret_marker_match-light"
              : "bg-fret_marker_match-dark"
          );
        }
      } else {
        if (isBehindCapo) {
          neededClasses.push(
            themeValue === Theme.Light
              ? "bg-disabled-light"
              : "bg-disabled-dark"
          );
        } else {
          neededClasses.push(
            themeValue === Theme.Light
              ? "bg-fret_marker-light"
              : "bg-fret_marker-dark"
          );
        }
      }
    }

    const neededClassesSet = new Set<string>(neededClasses);
    const notNeededClasses = fretMarkerPossibleClasses.filter(
      (element) => !neededClassesSet.has(element)
    );

    const classList = typographyElement.classList;
    classList.remove(...notNeededClasses);
    classList.add(...neededClasses);
  }, [fretboardScaleX, fretboardScaleY, isBehindCapo, isColored]);

  useEffect(toggleClasses, [toggleClasses, neck]);

  useEffect(() => {
    if (isHeader) {
      return;
    }
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
            chordFingerRef.current = undefined;
            return;
          }
          const noteMetadata = metadata as NoteMetadata;
          if (
            chordIsBeingDetectedValue &&
            stringOctaveNote !== null &&
            stringOctaveNote.string <= MAX_STRING_INDEX_FOR_CHORD_GENERATION &&
            noteMetadata.skipChordDetection !== true
          ) {
            // this module is only loaded when chordIsBeingDetectedValue is true (meaning the chord detection button was pressed)
            const { chordDetectorBuilder } = await import(
              "@/app/engine/chords/chordDetectorBuilder"
            );
            isChordBeingDetectedRef.current = true;
            void chordDetectorBuilder.addNote({
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

          if (noteMetadata.fromChord === true) {
            isFromPreviousChordRef.current = true;
            chordFingerRef.current = noteMetadata.chordFinger;
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
  }, [dispatch, stringOctaveNote, isHeader, toggleClasses]);

  const getMarkerText = (stringOctaveNote: StringOctaveNote) => {
    if (isHeader) {
      return stringOctaveNote.note;
    }
    // always show Note for the 0 fret (open string)
    const displayMode =
      stringOctaveNote.fret === capoValue
        ? NoteDisplayMode.Note
        : noteDisplayMode;
    switch (displayMode) {
      case NoteDisplayMode.Note:
        return serializeOctaveNote(stringOctaveNote);
      case NoteDisplayMode.Note_Shift: {
        const result =
          (stringOctaveNote.note - getShiftedNote(capoValue, tuningValue)) %
          NOTE_COUNT;
        return result >= 0 ? result : result + NOTE_COUNT;
      }
      default:
        return fret;
    }
  };

  const handlePress = async () => {
    if (isHeader) {
      if (!neck) {
        return;
      }
      console.log(
        "Playing all the notes on fret at tick %d",
        fret,
        currentTick
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
      currentTick
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
          {/* We can add transition-colors, but it slows down the playback */}
          <Typography
            variant="button"
            className={`flex justify-center items-center font-mono contain-content
                      ${
                        isHeader
                          ? `${
                              theme === Theme.Light
                                ? "text-foreground-light"
                                : "text-foreground-dark"
                            }`
                          : "rounded-full w-7 h-7"
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
              }}
              className="opacity-0 contain-content animate-blast absolute z-10 rounded-full hidden"
            />
          }
        </>
      )}
    </div>
  );
};
