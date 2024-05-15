import { Theme } from "@/app/data/theme";
import { useInputChecker } from "@/app/helpers/useInputChecker";
import { useStrumming } from "@/app/hooks/useStrumming";
import { selectUi } from "@/app/store/uiSlice";
import React, { useEffect, useState } from "react";
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
  ChordMetadata,
  ChordToChordButtonEventMap,
} from "../../engine/eventBus";
import {
  chordIsBeingDetectedValue,
  chordNotesToPlayValue,
  chordPlayModeValue,
  chordStrummingDelayMsValue,
} from "../../store/settingsSlice";

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
  const hasTouchInput = useInputChecker();
  const isDisabled = !noteChordMode.variations.length;

  const [wasPlayedLast, setWasPlayedLast] = useState<boolean>(false);
  const [animate, setAnimate] = useState(false);
  const { onChordPress, isPlaying, isClicked, isGracePeriod, isAlternateRef } =
    useStrumming(chordName, isDisabled, hasTouchInput);

  const { theme, useSharpChords } = useSelector(selectUi);

  useEffect(() => {
    const handleChordEvent = async (metadata: ChordMetadata) => {
      if (isDisabled) {
        return;
      }

      if (metadata.clear) {
        console.log("Clear previous chord marker: " + chordName);
        setWasPlayedLast(false);
        return;
      }

      if (chordIsBeingDetectedValue) {
        const { clearDetector } = await import("@/app/engine/chordDetector");
        // to make sure chords are always detected when played
        clearDetector();
      }

      console.log("Playing chord: " + chordName);
      setWasPlayedLast(true);
      // Start the animation sequence
      setAnimate(true);
      setTimeout(() => setAnimate(false), 150);

      const delayMs = metadata.strummingDelayMs ?? chordStrummingDelayMsValue;
      const params: ChordPlayParameters = {
        chordName,
        noteChordMode,
        delayMs,
        notesToPlay: metadata.notesToPlay ?? chordNotesToPlayValue,
        trackNumber: metadata.trackNumber,
        trackInstrument: metadata.trackInstrument,
        reverse: isAlternateRef.current,
      };

      switch (chordPlayModeValue) {
        case ChordPlayMode.Round_Robin:
          await playRoundRobin(params);
          break;
        case ChordPlayMode.All_Variations:
          await playAllVariations(params);
          break;
        case ChordPlayMode.First_Variation:
          await playFirstChordVariation(params);
          break;
        case ChordPlayMode.Closest_Variation:
          await playClosestChordVariation(params);
          break;
        case ChordPlayMode.Random_Variation:
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
  }, [chordName, isDisabled, noteChordMode, isAlternateRef]);

  if (isHidden) {
    return null;
  }

  return (
    <ul
      onTouchStart={
        hasTouchInput
          ? () => {
              onChordPress();
            }
          : undefined
      }
      onMouseDown={
        !hasTouchInput
          ? () => {
              onChordPress();
            }
          : undefined
      }
      className={`text-center w-16 ${useSharpChords ? "h-6" : "h-10"} ${
        (isPlaying || isGracePeriod || isClicked) && "border-2"
      } items-center justify-center content-center ${
        isGracePeriod
          ? theme === Theme.Light
            ? "border-accent_stronger-light"
            : " border-accent_stronger-dark"
          : isPlaying
          ? theme === Theme.Light
            ? "border-accent_strongest-light"
            : " border-accent_strongest-dark"
          : isClicked
          ? theme === Theme.Light
            ? "border-accent-light"
            : "border-accent-dark"
          : undefined
      } ${
        isDisabled
          ? theme === Theme.Light
            ? "bg-disabled-light text-gray-500"
            : "bg-disabled-dark text-gray-500"
          : animate
          ? `scale-50 ${
              theme === Theme.Light
                ? "bg-button_pressed-light"
                : "bg-button_pressed-dark"
            }`
          : `scale-100 ${
              isClicked && !isPlaying
                ? "cursor-progress"
                : isPlaying || (!isDisabled && !isClicked)
                ? " cursor-pointer"
                : undefined
            } ${
              theme === Theme.Light
                ? wasPlayedLast
                  ? "bg-secondary-light"
                  : "bg-button-light"
                : wasPlayedLast
                ? "bg-secondary-dark"
                : "bg-button-dark"
            }`
      } font-mono select-none ${
        theme === Theme.Light ? "text-foreground-light" : "text-foreground-dark"
      } transition-transform transform origin-center`}
    >
      {chordName}
    </ul>
  );
};
