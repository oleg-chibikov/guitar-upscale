import { Theme } from "@/app/data/theme";
import { waitForNextTick } from "@/app/engine/mainClock";
import { selectUi } from "@/app/store/uiSlice";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { ChordPlayMode } from "../../data/chordPlayMode";
import {
  ChordPlayParameters,
  playAllVariations,
  playClosestChordVariation,
  playFirstChordVariation,
  playRandomChordVariation,
  playRoundRobin,
} from "../../engine/chordPlayer";
import { NoteChordMode } from "../../engine/chordsGenerator";
import {
  ChordEventBus,
  ChordMetadata,
  ChordToChordButtonEventMap,
} from "../../engine/eventBus";
import { useInputChecker } from "../../helpers/useInputChecker";
import { selectSettings } from "../../store/settingsSlice";

interface ChordButtonProps {
  chordName: string;
  noteChordMode: NoteChordMode;
  isHidden: boolean;
}

export const ChordButton: React.FC<ChordButtonProps> = ({
  chordName,
  noteChordMode,
  isHidden,
}) => {
  const { chordPlayMode, chordStrummingDelayMs, chordNotesToPlay } =
    useSelector(selectSettings);
  const hasTouchInput = useInputChecker();
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (!isClickedRef.current) {
        return;
      }
      let target = event.target as Node | null;
      let isInsideFretMarker = false;

      // if the user clicks on any button or on chords - don't hide the settings, use standard action for this button
      while (target && target !== document) {
        if ((target as HTMLElement)?.classList.contains("fret-marker")) {
          isInsideFretMarker = true;
          break;
        }
        target = target.parentNode;
      }

      if (isInsideFretMarker) {
        return;
      }

      if (!isPlayingRef.current) {
        // there was not enough time to start strumming - play chord immediately
        ChordEventBus.next({ chord: chordName, metadata: {} });
      } else {
        // stop strumming without playing the chord immediately
        isPlayingRef.current = false;
      }
      isClickedRef.current = false;
    };

    !hasTouchInput && document.addEventListener("mouseup", handleClickOutside);
    hasTouchInput && document.addEventListener("touchend", handleClickOutside);

    return () => {
      !hasTouchInput &&
        document.removeEventListener("mouseup", handleClickOutside);
      hasTouchInput &&
        document.removeEventListener("touchend", handleClickOutside);
    };
  }, [chordName, hasTouchInput]);
  const isClickedRef = useRef<boolean>();
  const isPlayingRef = useRef<boolean>();
  const startStrumming = async () => {
    isClickedRef.current = true;
    await waitForNextTick();
    if (!isClickedRef.current) {
      // already released mouse/touch - don't play the strumming
      return;
    }
    isPlayingRef.current = true;
    while (isPlayingRef.current) {
      ChordEventBus.next({ chord: chordName, metadata: {} });
      await waitForNextTick();
    }
  };
  const { theme } = useSelector(selectUi);
  const disabled = !noteChordMode.variations.length;
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    const handleChordEvent = async (metadata: ChordMetadata) => {
      if (disabled) {
        console.log("Chord not enabled: " + chordName);
        return;
      }

      console.log("Playing chord: " + chordName);

      // Start the animation sequence
      setPressed(true);
      setTimeout(() => setPressed(false), 150);

      const delayMs = metadata.strummingDelayMs ?? chordStrummingDelayMs;
      const params: ChordPlayParameters = {
        chordName,
        noteChordMode,
        delayMs,
        notesToPlay: metadata.notesToPlay ?? chordNotesToPlay,
        trackNumber: metadata.trackNumber,
        trackInstrument: metadata.trackInstrument,
      };

      switch (chordPlayMode) {
        case ChordPlayMode.RoundRobin:
          await playRoundRobin(params);
          break;
        case ChordPlayMode.AllVariations:
          await playAllVariations(params);
          break;
        case ChordPlayMode.FirstVariation:
          await playFirstChordVariation(params);
          break;
        case ChordPlayMode.ClosestVariation:
          await playClosestChordVariation(params);
          break;
        case ChordPlayMode.RandomVariation:
          await playRandomChordVariation(params);
          break;
        default:
          break;
      }
    };

    ChordToChordButtonEventMap.set(chordName, handleChordEvent);

    return () => {
      ChordToChordButtonEventMap.delete(chordName);
    };
  }, [
    chordName,
    chordPlayMode,
    chordStrummingDelayMs,
    chordNotesToPlay,
    disabled,
    noteChordMode,
  ]);

  if (isHidden) {
    return null;
  }

  return (
    <ul
      onTouchStart={
        hasTouchInput
          ? () => {
              startStrumming();
            }
          : undefined
      }
      onMouseDown={
        !hasTouchInput
          ? () => {
              startStrumming();
            }
          : undefined
      }
      className={`text-center w-16 h-10 items-center justify-center content-center ${
        disabled
          ? theme === Theme.Light
            ? "bg-disabled-light text-gray-500"
            : "bg-disabled-dark text-gray-500"
          : pressed
          ? `scale-50 ${
              theme === Theme.Light
                ? "bg-button_pressed-light"
                : "bg-button_pressed-dark"
            }`
          : `scale-100 cursor-pointer ${
              theme === Theme.Light ? "bg-button-light" : "bg-button-dark"
            }`
      } font-mono select-none ${
        theme === Theme.Light ? "text-foreground-light" : "text-foreground-dark"
      } transition-transform transform origin-center`}
    >
      {chordName}
    </ul>
  );
};
