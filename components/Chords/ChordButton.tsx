import React, { useEffect, useState } from "react";
import { Animated, Easing, Text } from "react-native"; // Import Animated and Easing
import { ChordToChordButtonEventMap } from "../../engine/eventBus";
import { useInputChecker } from "../../helpers/useInputChecker";
import { tw } from "../../tailwind";

interface ChordButtonProps {
  chordName: string; // Change chord to chordName
  onPress: () => void;
  disabled?: boolean;
}

export const ChordButton: React.FC<ChordButtonProps> = ({
  chordName,
  onPress,
  disabled,
}) => {
  useEffect(() => {
    ChordToChordButtonEventMap.set(chordName, () => {
      console.log("Playing chord (auto): " + chordName);
      handleClick();
    });
    return () => {
      // TODO: Why deleting handlers here leads to absense of sounds? they should be recreated
      // NoteToFretMarkerEventMap.delete(key);
    };
  }, [chordName]);
  const hasTouchInput = useInputChecker();
  const [scaleAnim] = useState(new Animated.Value(1)); // State for scaling animation
  const [opacityAnim] = useState(new Animated.Value(1)); // State for opacity animationconst
  const [colorAnim] = useState(new Animated.Value(0)); // State for color animation

  const handleClick = () => {
    if (disabled) {
      return;
    }

    onPress();

    // Start the animation sequence
    startAnimation();
  };

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
          await handleClick();
        }
      }}
      onStartShouldSetResponder={() => {
        if (!hasTouchInput) {
          // this event handler is only for mouse devices
          handleClick();
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
