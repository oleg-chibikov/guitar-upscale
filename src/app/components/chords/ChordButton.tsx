import { Theme } from "@/app/data/theme";
import { useInputChecker } from "@/app/helpers/useInputChecker";
import { useStrumming } from "@/app/hooks/useStrumming";
import { selectUi } from "@/app/store/uiSlice";
import React, { useCallback, useEffect, useState } from "react";
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
import {
  chordIsBeingDetectedValue,
  chordNotesToPlayValue,
  chordPlayModeValue,
  chordStrummingDelayMsValue,
  currentChord,
  seamlessChordSwitchingValue,
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
  const play = useCallback(() => {
    const chordToPlay =
      seamlessChordSwitchingValue && currentChord ? currentChord : chordName;
    // Using currentChord here is needed for seamless switching between chords while playing the strumming pattern
    ChordEventBus.next({ chord: chordToPlay, metadata: {} });
  }, [chordName]);
  const isDisabled = !noteChordMode.variations.length;

  const [wasPlayedLast, setWasPlayedLast] = useState<boolean>(false);
  const [animate, setAnimate] = useState(false);
  const { startStrumming, isPlaying, isClicked, isAlternateRef } = useStrumming(
    chordName,
    play,
    isDisabled,
    hasTouchInput
  );

  const { theme } = useSelector(selectUi);

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
        const { clearDetector } = await import("../../engine/chordDetector");
        // to make sure chords are always detected when played
        //TODO am/9 and other /9 instead of am etc
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
        isPlaying
          ? theme === Theme.Light
            ? "border-border_accent_stronger-light"
            : "border-2 border-border_accent_stronger-dark"
          : isClicked
          ? theme === Theme.Light
            ? "border-2 border-border_accent-light"
            : "border-2 border-border_accent-dark"
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
                  ? "bg-previous_chord-light"
                  : "bg-button-light"
                : wasPlayedLast
                ? "bg-previous_chord-dark"
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
