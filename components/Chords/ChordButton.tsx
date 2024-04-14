import React, { useEffect, useState } from "react";
import { Animated, Easing, Text } from "react-native"; // Import Animated and Easing
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
import { tw } from "../../tailwind";

interface ChordButtonProps {
  chordName: string; // Change chord to chordName
  noteChordMode: NoteChordMode;
}

export const ChordButton: React.FC<ChordButtonProps> = ({
  chordName,
  noteChordMode,
}) => {
  const { chordPlayMode, chords, chordStrummingDelayMs } =
    useSelector(selectControlPanel);
  const disabled = !noteChordMode.variations.length;
  useEffect(() => {
    ChordToChordButtonEventMap.set(chordName, async (metadata) => {
      if (disabled) {
        console.log("Chord not enabled: " + chordName);
        return;
      }

      console.log("Playing chord: " + chordName);

      // Start the animation sequence
      startAnimation();

      const delayMs = metadata.strummingDelayMs ?? chordStrummingDelayMs;
      const params: ChordPlayParameters = {
        chordName,
        noteChordMode,
        delayMs,
        notesToPlay: metadata.notesToPlay,
      };

      switch (chordPlayMode) {
        case ChordPlayMode.RoundRobin:
          return await playRoundRobin(params);
        case ChordPlayMode.AllVariations:
          return await playAllVariations(params);
        case ChordPlayMode.FirstVariation:
          return await playFirstChordVariation(params);
        case ChordPlayMode.ClosestVariation:
          return await playClosestChordVariation(params);
        case ChordPlayMode.RandomVariation:
          return await playRandomChordVariation(params);
      }
    });
    return () => {
      // TODO: Why deleting handlers here leads to absense of sounds? they should be recreated
      ChordToChordButtonEventMap.delete(chordName);
    };
  }, [chordName, chordPlayMode, chords, disabled, chordStrummingDelayMs]);
  const hasTouchInput = useInputChecker();
  const [scaleAnim] = useState(new Animated.Value(1)); // State for scaling animation
  const [opacityAnim] = useState(new Animated.Value(1)); // State for opacity animationconst
  const [colorAnim] = useState(new Animated.Value(0)); // State for color animation

  const animationTime = 300;
  const easing = Easing.ease;
  const startAnimation = () => {
    // Sequence of animations
    Animated.sequence([
      Animated.parallel([
        // First animation: Scale down and change color
        Animated.timing(scaleAnim, {
          toValue: 0.5,
          duration: animationTime,
          easing,
          useNativeDriver: true,
        }),

        Animated.timing(colorAnim, {
          toValue: 1,
          duration: animationTime,
          easing,
          useNativeDriver: false,
        }),

        // Second animation: Fade out
        Animated.timing(opacityAnim, {
          toValue: 0.5,
          duration: animationTime,
          easing,
          useNativeDriver: true,
        }),
      ]),
      // Third animation: Scale back to normal, change color back to original, and fade in
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: animationTime,
          easing,
          useNativeDriver: true,
        }),
        Animated.timing(colorAnim, {
          toValue: 0,
          duration: animationTime,
          easing,
          useNativeDriver: false,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: animationTime,
          easing,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  return (
    <Animated.View
      onTouchStart={async () => {
        // using onTouchStart on a View supports multiouch (play chords), while the other methods don't seem to support
        if (hasTouchInput) {
          // this event handler is only for touch devices

          ChordEventBus.next({ chord: chordName, metadata: {} });
        }
      }}
      onStartShouldSetResponder={() => {
        if (!hasTouchInput) {
          console.log(2);
          // this event handler is only for mouse devices

          ChordEventBus.next({ chord: chordName, metadata: {} });
        }
        return true;
      }} // Capture both touch and mouse events
      style={[
        {
          backgroundColor: colorAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ["#007AFF", "#00E500"], // Original color to green
          }),
        },
        {
          cursor: "pointer",
        },
        tw`w-14 h-6 px-2 py-1 items-center justify-center`,
        disabled ? tw`bg-gray-400` : undefined,
      ]}
    >
      {/* Apply the scaling and opacity transformations to the text */}
      <Animated.Text
        style={[
          tw`text-white`,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <Text selectable={false} style={tw`font-mono`}>
          {chordName}
        </Text>
      </Animated.Text>
    </Animated.View>
  );
};
