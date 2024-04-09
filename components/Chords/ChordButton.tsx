import React, { useState } from "react";
import { Animated, Easing, Pressable } from "react-native"; // Import Animated and Easing
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
  const [scaleAnim] = useState(new Animated.Value(1)); // State for scaling animation
  const [opacityAnim] = useState(new Animated.Value(1)); // State for opacity animation

  const handleClick = () => {
    onPress();

    // Start the animation sequence
    startAnimation();
  };

  const startAnimation = () => {
    // Sequence of animations
    Animated.sequence([
      Animated.parallel([
        // First animation: Scale down
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),

        // Second animation: Fade out
        Animated.timing(opacityAnim, {
          toValue: 0.5,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
      // Third animation: Scale back to normal and fade in
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  return (
    <Pressable
      disabled={disabled}
      onPress={handleClick}
      style={[
        tw`w-13 px-2 py-1 items-center justify-center`,
        disabled ? tw`bg-gray-400` : tw`bg-blue-500 hover:bg-blue-600`,
      ]}
    >
      {/* Apply the scaling and opacity transformations to the text */}
      <Animated.Text
        selectable={false}
        style={[
          tw`text-white`,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        {chordName}
      </Animated.Text>
    </Pressable>
  );
};
