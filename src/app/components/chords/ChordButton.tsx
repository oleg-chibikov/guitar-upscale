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
  ChordEventBus,
  ChordToChordButtonEventMap,
} from "../../engine/eventBus";
import { useInputChecker } from "../../helpers/useInputChecker";
import { Theme, selectControlPanel } from "../../store/controlPanelSlice";

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
  const { chordPlayMode, chordStrummingDelayMs, chordNotesToPlay, theme } =
    useSelector(selectControlPanel);
  const disabled = !noteChordMode.variations.length;
  const hasTouchInput = useInputChecker();

  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    const handleChordEvent = async (metadata: any) => {
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
      onTouchStart={() => {
        if (hasTouchInput) {
          ChordEventBus.next({ chord: chordName, metadata: {} });
        }
      }}
      onMouseDown={() => {
        if (!hasTouchInput) {
          ChordEventBus.next({ chord: chordName, metadata: {} });
        }
      }}
      className={`text-center w-16 h-6 items-center justify-center content-center ${
        disabled
          ? theme === Theme.Light
            ? "bg-disabled-light"
            : "bg-disabled-dark"
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
