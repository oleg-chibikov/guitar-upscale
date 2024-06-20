import { NoteChordMode } from "@/app/data/chordModes";
import { ChordPlayMode } from "@/app/data/chordPlayMode";
import { Theme } from "@/app/data/theme";
import {
  ChordPlayParameters,
  playAllVariations,
  playClosestChordVariation,
  playFirstChordVariation,
  playRandomChordVariation,
  playRoundRobin,
} from "@/app/engine/chords/chordPlayer";
import { getCurrentRelativeTick } from "@/app/engine/clock/mainClock";
import {
  ChordMetadata,
  ChordToChordButtonEventMap,
} from "@/app/engine/eventBus";
import { useInputChecker } from "@/app/hooks/useInputChecker";
import { useStrumming } from "@/app/hooks/useStrumming";
import {
  chordIsBeingDetectedValue,
  chordPlayModeValue,
  chordStrummingDelayMsValue,
} from "@/app/store/settingsSlice";
import { selectUi } from "@/app/store/uiSlice";
import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";

interface ChordButtonProps {
  chordName: string;
  noteChordMode: NoteChordMode;
  isHidden: boolean;
  onStrummingClickedChange: (value: boolean) => void;
}

export const ChordButton: React.FC<ChordButtonProps> = ({
  chordName,
  noteChordMode,
  isHidden,
  onStrummingClickedChange,
}) => {
  const elementRef = useRef<HTMLUListElement>(null);
  const hasTouchInput = useInputChecker();
  const isDisabled = !noteChordMode.variations.length;
  const isClickedRef = useRef<boolean>(false);
  const isPlayingRef = useRef<boolean>(false);
  const isGracePeriodRef = useRef<boolean>(false);

  const toggleCursor = () => {
    const element = elementRef.current;
    if (!element) {
      return;
    }
    const classList = element.classList;
    classList.remove("cursor-progress", "cursor-pointer");
    if (isClickedRef.current && !isPlayingRef.current) {
      classList.add("cursor-progress");
    } else if (isPlayingRef.current || (!isDisabled && !isClickedRef.current)) {
      classList.add("cursor-pointer");
    }
  };

  const toggleBorder = () => {
    const element = elementRef.current;
    if (!element) {
      return;
    }
    const classList = element.classList;
    classList.remove(
      "border-2",
      "border-accent_stronger-light",
      "border-accent_stronger-dark",
      "border-accent_strongest-light",
      "border-accent_strongest-dark",
      "border-accent-light",
      "border-accent-dark"
    );
    if (
      isClickedRef.current ||
      isPlayingRef.current ||
      isGracePeriodRef.current
    ) {
      classList.add("border-2");

      if (isGracePeriodRef.current) {
        classList.add(
          theme === Theme.Light
            ? "border-accent_stronger-light"
            : "border-accent_stronger-dark"
        );
      } else if (isPlayingRef.current) {
        classList.add(
          theme === Theme.Light
            ? "border-accent_strongest-light"
            : "border-accent_strongest-dark"
        );
      } else {
        classList.add(
          theme === Theme.Light ? "border-accent-light" : "border-accent-dark"
        );
      }
    }
  };

  const toggleBackground = () => {
    const element = elementRef.current;
    if (!element) {
      return;
    }
    const classList = element.classList;
    classList.remove(
      "bg-button_pressed-light",
      "bg-button_pressed-dark",
      "bg-secondary-light",
      "bg-secondary-dark",
      "bg-button-light",
      "bg-button-dark"
    );
    if (isClickedRef.current) {
      classList.add(
        theme === Theme.Light
          ? "bg-button_pressed-light"
          : "bg-button_pressed-dark"
      );
    } else if (wasPlayedLastRef.current) {
      classList.add(
        theme === Theme.Light ? "bg-secondary-light" : "bg-secondary-dark"
      );
    } else {
      classList.add(
        theme === Theme.Light ? "bg-button-light" : "bg-button-dark"
      );
    }
  };

  const onClickedChange = (value: boolean) => {
    isClickedRef.current = value;
    // let the parent component know that the strumming clicked state has changed
    onStrummingClickedChange(value);
    toggleBorder();
    toggleCursor();
    toggleBackground();
  };

  const onPlayingChange = (value: boolean) => {
    isPlayingRef.current = value;
    toggleBorder();
    toggleCursor();
  };

  const onGracePeriodChange = (value: boolean) => {
    isGracePeriodRef.current = value;
    toggleBorder();
  };

  const wasPlayedLastRef = useRef<boolean>(false);
  const { onChordPress, isAlternateRef } = useStrumming(
    chordName,
    isDisabled,
    hasTouchInput,
    onClickedChange,
    onPlayingChange,
    onGracePeriodChange
  );

  const { theme, useSharpChords } = useSelector(selectUi);

  useEffect(() => {
    const animate = () => {
      if (!elementRef.current) {
        return;
      }

      elementRef.current.classList.add("scale-50");
      void elementRef.current.offsetWidth; // trigger reflow
      setTimeout(() => {
        elementRef.current?.classList.remove("scale-50");
      }, 150);
    };

    const handleChordEvent = async (metadata: ChordMetadata) => {
      if (isDisabled) {
        return;
      }

      if (metadata.clear === true) {
        console.log("Clear previous chord marker: " + chordName);
        wasPlayedLastRef.current = false;
        toggleBackground();
        return;
      }

      if (chordIsBeingDetectedValue) {
        // only load the module when the variable is true (meaning the chord detection button was pressed)
        const { chordDetectorBuilder } = await import(
          "@/app/engine/chords/chordDetectorBuilder"
        );
        // to make sure chords are always detected when played
        chordDetectorBuilder.clear();
      }

      console.log(
        "Playing chord: %s at tick %d",
        chordName,
        getCurrentRelativeTick()
      );
      wasPlayedLastRef.current = true;
      toggleBackground();

      // Start the animation sequence
      animate();

      const delayMs = metadata.strummingDelayMs ?? chordStrummingDelayMsValue;
      const params: ChordPlayParameters = {
        ...metadata,
        chordName,
        noteChordMode,
        delayMs,
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
      ref={elementRef}
      onTouchStartCapture={
        hasTouchInput
          ? async () => {
              await onChordPress();
            }
          : undefined
      }
      onMouseDownCapture={
        hasTouchInput
          ? undefined
          : async () => {
              await onChordPress();
            }
      }
      className={`flex items-center justify-center content-center text-center w-16 font-mono transition-transform transform origin-center
      ${useSharpChords ? "text-xs h-5" : "text-md h-8"}
      ${
        isDisabled
          ? theme === Theme.Light
            ? "bg-disabled-light text-gray-500"
            : "bg-disabled-dark text-gray-500"
          : theme === Theme.Light
          ? "bg-button-light"
          : "bg-button-dark"
      }
      ${
        theme === Theme.Light ? "text-foreground-light" : "text-foreground-dark"
      }`}
    >
      {chordName}
    </ul>
  );
};
