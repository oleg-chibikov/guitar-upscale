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
import { selectControlPanel } from "../../store/controlPanelSlice";

interface ChordButtonProps {
  chordName: string;
  noteChordMode: NoteChordMode;
}

export const ChordButton: React.FC<ChordButtonProps> = ({
  chordName,
  noteChordMode,
}) => {
  const { chordPlayMode, chordStrummingDelayMs, chordNotesToPlay } =
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
      setTimeout(() => setPressed(false), 300);

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

  const animationClasses = pressed
    ? "scale-50 bg-green-500"
    : "scale-100 bg-blue-500";

  return (
    <div
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
      className={`w-14 h-6 px-2 py-1 items-center justify-center cursor-pointer ${
        disabled ? "bg-gray-400" : animationClasses
      }`}
    >
      <div className="text-white transition-transform transition-opacity transform origin-center">
        <span className="font-mono select-none">{chordName}</span>
      </div>
    </div>
  );
};
