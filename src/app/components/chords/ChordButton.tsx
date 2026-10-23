import { ChordMode, ChordVariations } from "@/app/data/chordModes";
import { ChordPlayMode } from "@/app/data/chordPlayMode";
import { Note } from "@/app/data/notes";
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
import { useInputChecker } from "@/app/hooks/useInputChecker";
import { useStrumming } from "@/app/hooks/useStrumming";
import {
  chordIsBeingDetectedValue,
  chordPlayModeValue,
  chordStrummingDelayMsValue,
} from "@/app/store/settingsSlice";
import React, { useCallback, useEffect, useRef } from "react";
import { ChordGridStore } from "./chordGridStore";

interface ChordButtonProps {
  chordName: string;
  variations: ChordVariations;
  isHidden: boolean;
  onStrummingStateChange: (value: boolean) => void;
  chordMode: ChordMode;
  note: Note;
  store: ChordGridStore;
}

/**
 * Plays one chord and keeps its button state in the store. The chord grid canvas draws the button.
 */
export const ChordButton: React.FC<ChordButtonProps> = ({
  chordName,
  variations,
  isHidden,
  chordMode,
  note,
  onStrummingStateChange,
  store,
}) => {
  const hasTouchInput = useInputChecker();
  const isDisabled = !variations.length; // TODO: hide if there's no preferred variation of current type
  const isClickedRef = useRef<boolean>(false);
  const isPlayingRef = useRef<boolean>(false);
  const isGracePeriodRef = useRef<boolean>(false);
  const wasPlayedLastRef = useRef<boolean>(false);
  const isInImmediateChordGracePeriodRef = useRef<NodeJS.Timeout | undefined>(
    undefined,
  );

  const publishState = useCallback(() => {
    store.update(chordName, {
      isClicked: isClickedRef.current,
      isPlaying: isPlayingRef.current,
      isGracePeriod: isGracePeriodRef.current,
      isInImmediateChordGracePeriod:
        isInImmediateChordGracePeriodRef.current !== undefined,
      wasPlayedLast: wasPlayedLastRef.current,
    });
  }, [store, chordName]);

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
    publishState();
  };

  const onPlayingChange = (value: boolean) => {
    isPlayingRef.current = value;
    if (value) {
      // let the parent component know that the strumming has started (and disable overflow)
      onStrummingStateChange(true);
    }
    publishState();
  };

  const onGracePeriodChange = (value: boolean) => {
    isGracePeriodRef.current = value;
    publishState();
  };

  const { onChordPress, isAlternateRef } = useStrumming(
    chordName,
    isDisabled,
    hasTouchInput,
    isInImmediateChordGracePeriodRef,
    onClickedChange,
    onPlayingChange,
    onGracePeriodChange,
    publishState,
  );

  const onChordPressRef = useRef(onChordPress);
  useEffect(() => {
    onChordPressRef.current = onChordPress;
  });

  useEffect(() => {
    if (isDisabled || isHidden) {
      return;
    }
    return store.registerPress(chordName, () => onChordPressRef.current());
  }, [isDisabled, isHidden, store, chordName]);

  useEffect(() => {
    const animate = () => store.pulse(chordName);

    const handleChordEvent = async (
      metadata: ChordMetadata | ChordClearMetadata,
    ) => {
      if (isDisabled) {
        return;
      }

      if ((metadata as ChordClearMetadata).clear === true) {
        processClearChord(chordName, wasPlayedLastRef, publishState);
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
        publishState();

        // Start the animation sequence
        animate();

        if (metadata.chordMode === undefined) {
          metadata.chordMode = chordMode;
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
    publishState,
    chordMode,
    note,
    store,
  ]);

  return null;
};
function processClearChord(
  chordName: string,
  wasPlayedLastRef: React.MutableRefObject<boolean>,
  publishState: () => void,
) {
  console.log("Clear previous chord marker: " + chordName);
  wasPlayedLastRef.current = false;
  publishState();
}
