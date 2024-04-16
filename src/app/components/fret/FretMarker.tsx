import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { NoteDisplayMode } from "../../data/noteDisplayMode";
import {
  StringOctaveNote,
  getNoteText,
  serializeStringOctaveNote,
} from "../../data/notes";
import {
  NotePlayEventBus,
  NoteToFretMarkerEventMap,
} from "../../engine/eventBus";
import { sleep } from "../../engine/sleep";
import { playNote } from "../../engine/soundProvider";
import { useInputChecker } from "../../helpers/useInputChecker";
import {
  selectControlPanel,
  velocityValue,
} from "../../store/controlPanelSlice";

const coloredHeaders = new Set<number>([0, 3, 5, 7, 9, 12, 15, 17, 19, 21, 24]);

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
    noteDisplayMode,
    neck,
    chordStrummingDelayMs,
    fretboardScaleX,
    fretboardScaleY,
    baseNote,
  } = useSelector(selectControlPanel);

  const hasTouchInput = useInputChecker();
  const [isFromPreviousChord, setIsFromPreviousChord] =
    useState<boolean>(false);
  const [isNoteClicked, setIsNoteClicked] = useState<boolean>(false);

  useEffect(() => {
    // Function to play note and start animation
    const playNoteAndAnimate = () => {
      if (stringOctaveNote) {
        setIsNoteClicked(false);
        playNote(stringOctaveNote, velocityValue ?? velocity);
        setIsNoteClicked(true);
        setTimeout(() => {
          setIsNoteClicked(false);
        }, 300); // Adjust the duration of the animation as needed
      }
    };

    if (stringOctaveNote) {
      const key = serializeStringOctaveNote(stringOctaveNote);
      NoteToFretMarkerEventMap.set(key, (metadata) => {
        if (metadata.clearChordMarker) {
          setIsFromPreviousChord(false);
        } else {
          playNoteAndAnimate();
          if (metadata.fromChord) {
            setIsFromPreviousChord(true);
          }
        }
      });
      return () => {
        NoteToFretMarkerEventMap.delete(key);
      };
    }
    return;
  }, [stringOctaveNote, velocity]);

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
    // Space for the marker - it's drawn even if the marker is not present for the current scale
    <div
      className={`
      flex relative justify-center items-center h-5 pt-1 pb-1
      ${fret > 0 && "border-l-2 border-red-500"}
      ${isHeader && "h-9 " + (isColored ? "bg-orange-400" : "bg-orange-100")}
      `}
      style={{ width, top }}
    >
      {stringOctaveNote && (
        <>
          {/* The marker itself */}
          <span
            className={`relative z-60 flex justify-center items-center select-none font-mono
              ${!isHeader && "rounded-full"}
              ${
                !isHeader &&
                (isFromPreviousChord
                  ? isColored
                    ? "bg-lime-500"
                    : "bg-green-500"
                  : isColored
                  ? "bg-orange-400"
                  : "bg-orange-100")
              }
              ${isHeader ? "text-xl" : "text-md"}
              ${isHeader || isColored ? "text-black" : "text-red-500"}
              ${isNoteClicked ? "fret-note-circle-animation" : ""}`}
            style={{
              width: `${30 * fretboardScaleX}px`, // Set width based on fretboard scaling
              height: `${30 * fretboardScaleY}px`, // Set height based on fretboard scaling
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
            className="absolute cursor-pointer z-70 bg-transparent h-9"
            style={{ width }}
            onTouchStart={async () => {
              if (stringOctaveNote && hasTouchInput) {
                await handlePress();
              }
            }}
            onMouseDown={() => {
              if (stringOctaveNote && !hasTouchInput) {
                handlePress();
              }
            }}
          />
        </>
      )}
    </div>
  );
};
