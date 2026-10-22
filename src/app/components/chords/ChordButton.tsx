import { ChordMode, ChordVariations } from "@/app/data/chordModes";
import { ChordPlayMode } from "@/app/data/chordPlayMode";
import { Note } from "@/app/data/notes";
import { Theme } from "@/app/data/theme";
import {
  ChordPlayParameters,
  playFirstChordVariation,
  playPreferredChordVariation,
  playRandomChordVariation,
  playRoundRobin,
} from "@/app/engine/chords/chordPlayer";
import { currentTick } from "@/app/engine/clock/mainClock";
import {
  ChordClearMetadata,
  ChordMetadata,
  ChordToChordButtonEventMap,
} from "@/app/engine/eventBus";
import { areOtherChordsStrumming } from "@/app/engine/strummingState";
import { chordButtonPossibleClasses } from "@/app/helpers/components/chordButtonPossibleClasses";
import { useUiSelector } from "@/app/hooks/storeHooks";
import { useInputChecker } from "@/app/hooks/useInputChecker";
import { useStrumming } from "@/app/hooks/useStrumming";
import {
  chordIsBeingDetectedValue,
  chordPlayModeValue,
  chordStrummingDelayMsValue,
} from "@/app/store/settingsSlice";
import { themeValue } from "@/app/store/uiSlice";
import { Typography } from "@mui/material";
import React, { useCallback, useEffect, useRef } from "react";

interface ChordButtonProps {
  chordName: string;
  variations: ChordVariations;
  isHidden: boolean;
  onStrummingStateChange: (value: boolean) => void;
  chordMode: ChordMode;
  note: Note;
}

export const ChordButton: React.FC<ChordButtonProps> = ({
  chordName,
  variations,
  isHidden,
  chordMode,
  note,
  onStrummingStateChange,
}) => {
  const elementRef = useRef<HTMLUListElement>(null);
  const hasTouchInput = useInputChecker();
  const isDisabled = !variations.length; // TODO: hide if there's no preferred variation of current type
  const isClickedRef = useRef<boolean>(false);
  const isPlayingRef = useRef<boolean>(false);
  const isGracePeriodRef = useRef<boolean>(false);
  const isInImmediateChordGracePeriodRef = useRef<NodeJS.Timeout | undefined>(
    undefined
  );

  const toggleClasses = useCallback(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    // cursor
    const neededClasses: string[] = [];
    if (isClickedRef.current && !isPlayingRef.current) {
      neededClasses.push("cursor-progress");
    } else if (isPlayingRef.current || (!isDisabled && !isClickedRef.current)) {
      neededClasses.push("cursor-pointer");
    }

    const isInImmediateChordGracePeriod =
      isInImmediateChordGracePeriodRef.current !== undefined;

    // border
    if (
      isClickedRef.current ||
      isPlayingRef.current ||
      isGracePeriodRef.current ||
      isInImmediateChordGracePeriod
    ) {
      neededClasses.push("border-2");
      if (isInImmediateChordGracePeriod) {
        neededClasses.push("border-red-500");
      } else if (isGracePeriodRef.current) {
        neededClasses.push(
          themeValue === Theme.Light
            ? "border-accent_stronger-light"
            : "border-accent_stronger-dark"
        );
      } else if (isPlayingRef.current) {
        neededClasses.push(
          themeValue === Theme.Light
            ? "border-accent_strongest-light"
            : "border-accent_strongest-dark"
        );
      } else {
        neededClasses.push(
          themeValue === Theme.Light
            ? "border-accent-light"
            : "border-accent-dark"
        );
      }
    }

    // background
    if (isClickedRef.current) {
      neededClasses.push(
        themeValue === Theme.Light
          ? "bg-button_pressed-light"
          : "bg-button_pressed-dark"
      );
    } else if (wasPlayedLastRef.current) {
      neededClasses.push(
        themeValue === Theme.Light ? "bg-secondary-light" : "bg-secondary-dark"
      );
    } else {
      neededClasses.push(
        themeValue === Theme.Light ? "bg-button-light" : "bg-button-dark"
      );
    }

    const neededClassesSet = new Set<string>(neededClasses);
    const notNeededClasses = chordButtonPossibleClasses.filter(
      (element) => !neededClassesSet.has(element)
    );

    const classList = element.classList;
    classList.remove(...notNeededClasses);
    classList.add(...neededClasses);
  }, [isDisabled, isInImmediateChordGracePeriodRef]);

  const onClickedChange = (value: boolean) => {
    isClickedRef.current = value;
    // let the parent component know that the strumming has finished (and enable overflow))
    if (!value) {
      onStrummingStateChange(false);
    } else {
      if (areOtherChordsStrumming(chordName)) {
        onStrummingStateChange(true);
      }
    }
    toggleClasses();
  };

  const onPlayingChange = (value: boolean) => {
    isPlayingRef.current = value;
    if (value) {
      // let the parent component know that the strumming has started (and disable overflow)
      onStrummingStateChange(true);
    }
    toggleClasses();
  };

  const onGracePeriodChange = (value: boolean) => {
    isGracePeriodRef.current = value;
    toggleClasses();
  };

  const wasPlayedLastRef = useRef<boolean>(false);
  const { onChordPress, isAlternateRef } = useStrumming(
    chordName,
    isDisabled,
    hasTouchInput,
    isInImmediateChordGracePeriodRef,
    onClickedChange,
    onPlayingChange,
    onGracePeriodChange,
    toggleClasses
  );

  const theme = useUiSelector((s) => s.theme);
  const useSharpChords = useUiSelector((s) => s.useSharpChords);

  useEffect(() => {
    toggleClasses();
  }, [theme, toggleClasses]);

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

    const handleChordEvent = async (
      metadata: ChordMetadata | ChordClearMetadata
    ) => {
      if (isDisabled) {
        return;
      }

      if ((metadata as ChordClearMetadata).clear === true) {
        processClearChord(chordName, wasPlayedLastRef, toggleClasses);
        return;
      }

      await processChord(metadata as ChordMetadata);

      async function processChord(metadata: ChordMetadata) {
        if (chordIsBeingDetectedValue) {
          // only load the module when the variable is true (meaning the chord detection button was pressed)
          const { chordDetectorBuilder } =
            await import("@/app/engine/chords/chordDetectorBuilder");
          // to make sure chords are always detected when played
          chordDetectorBuilder.clear();
        }

        console.log("Playing chord: %s at tick %d", chordName, currentTick);
        wasPlayedLastRef.current = true;
        toggleClasses();

        // Start the animation sequence
        animate();

        if (metadata.chordMode === undefined) {
          metadata.chordMode = chordMode;
        }
        if (metadata.octaveNote === undefined) {
          metadata.octaveNote = { note, octave: 5 };
        }
        const delayMs = metadata.strummingDelayMs ?? chordStrummingDelayMsValue;
        const params: ChordPlayParameters = {
          ...metadata,
          chordName,
          variations,
          delayMs,
          reverse: isAlternateRef.current,
        };

        switch (chordPlayModeValue) {
          case ChordPlayMode.Round_Robin:
            await playRoundRobin(params);
            break;
          case ChordPlayMode.First_Variation:
            await playFirstChordVariation(params);
            break;
          case ChordPlayMode.Preferred_Variation:
          case ChordPlayMode.Preferred_Variation_With_Min_Notes:
          case ChordPlayMode.Preferred_Variation_With_Max_Notes:
          case ChordPlayMode.Barre:
            await playPreferredChordVariation(params);
            break;
          case ChordPlayMode.With_Thumb:
            await playPreferredChordVariation(params);
            break;
          case ChordPlayMode.Random_Variation:
            await playRandomChordVariation(params);
            break;
          default:
            break;
        }
      }
    };

    ChordToChordButtonEventMap.set(chordName, handleChordEvent);

    return () => {
      ChordToChordButtonEventMap.delete(chordName);
    };
  }, [
    chordName,
    isDisabled,
    variations,
    isAlternateRef,
    toggleClasses,
    chordMode,
    note,
  ]);

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
      ${useSharpChords ? "text-xs h-6" : "text-md h-8"}
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
      <Typography
        noWrap
        variant="button"
        sx={{
          textTransform: "none",
        }}
      >
        {chordName}
      </Typography>
    </ul>
  );
};
function processClearChord(
  chordName: string,
  wasPlayedLastRef: React.MutableRefObject<boolean>,
  toggleClasses: () => void
) {
  console.log("Clear previous chord marker: " + chordName);
  wasPlayedLastRef.current = false;
  toggleClasses();
}
