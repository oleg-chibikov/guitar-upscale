import { ChordStrummingMode } from "@/app/data/chordStrummingMode";
import { Theme } from "@/app/data/theme";
import {
  waitForNextBeat,
  waitForNextHalfBeat,
  waitForNextQuarterBeat,
  waitForNextTick,
} from "@/app/engine/mainClock";
import { selectUi } from "@/app/store/uiSlice";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import {
  chordCustomStrummingPatternValue,
  chordCustomStrummingWaitForPatternFinishValue,
  chordStrummingModeValue,
  selectSettings,
  useChordAlterationValue,
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
  const isClickedRef = useRef<boolean>(false);
  const isPlayingRef = useRef<boolean>(false);
  const isAlternateRef = useRef<boolean>(false);

  const { chordPlayMode, chordStrummingDelayMs, chordNotesToPlay } =
    useSelector(selectSettings);

  const hasTouchInput = useInputChecker();

  const play = useCallback(() => {
    ChordEventBus.next({ chord: chordName, metadata: {} });
  }, [chordName]);

  const playWithPossibleAlteration = useCallback(() => {
    play();
    if (useChordAlterationValue) {
      isAlternateRef.current = !isAlternateRef.current;
    }
  }, [play]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (!isClickedRef.current) {
        return;
      }
      let target = event.target as Node | null;
      let isInsideFretMarker = false;

      while (target && target !== document) {
        const id = (target as HTMLElement)?.id;
        // keep playing chord when clicking notes simultaneously
        if (id === "fret-header" || id === "fret-notes") {
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
        playWithPossibleAlteration();
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
  }, [chordName, hasTouchInput, playWithPossibleAlteration]);

  const startStrumming = async () => {
    isClickedRef.current = true;
    let wait: () => Promise<void>;
    switch (chordStrummingModeValue) {
      case ChordStrummingMode.Beat:
        wait = waitForNextBeat;
        break;
      case ChordStrummingMode.HalfBeat:
        wait = waitForNextHalfBeat;
        break;
      case ChordStrummingMode.QuarterBeat:
        wait = waitForNextQuarterBeat;
        break;
      case ChordStrummingMode.Custom: {
        if (chordCustomStrummingWaitForPatternFinishValue) {
          // if the pattern should be played fully then start it at the beat beginning, otherwise it's fine to start at the next tick
          await waitForNextBeat();
        } else {
          await waitForNextTick();
        }
        isPlayingRef.current = true;
        while (isClickedRef.current) {
          const currentPattern = chordCustomStrummingPatternValue;

          for (const char of currentPattern) {
            if (!chordCustomStrummingWaitForPatternFinishValue) {
              // early break pattern only when the checkbox is off
              if (!isClickedRef.current) {
                // already released mouse/touch - don't play the strumming
                return;
              }
            }
            switch (char) {
              case "↑":
                isAlternateRef.current = false;
                play();
                break;
              case "↓":
                isAlternateRef.current = true;
                play();
                break;
              case "_":
                break;
            }
            await waitForNextTick();
          }
        }
        return;
      }
      default:
        wait = waitForNextTick;
    }
    await wait();
    if (!isClickedRef.current) {
      // already released mouse/touch - don't play the strumming
      return;
    }
    isPlayingRef.current = true;
    while (isPlayingRef.current) {
      playWithPossibleAlteration();
      await wait();
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
        reverse: isAlternateRef.current,
      };

      switch (chordPlayMode) {
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
