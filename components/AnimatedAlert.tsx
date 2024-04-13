import React, { useEffect, useRef } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import { tw } from "../tailwind";

interface AnimatedAlertProps {
  message: string;
  onClose: () => void;
}

export const AnimatedAlert: React.FC<AnimatedAlertProps> = ({
  message,
  onClose,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    // Animate alert in
    Animated.timing(translateY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Automatically close the alert after 3 seconds
    const timeout = setTimeout(() => {
      handleClose();
    }, 3000);

    return () => {
      clearTimeout(timeout);
      handleClose();
    };
  }, [translateY]);

  const handleClose = () => {
    // Animate alert out
    Animated.timing(translateY, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const handlePress = () => {
    // Close the alert when tapped
    handleClose();
  };

  return (
    <Animated.View
      style={[
        tw`w-56 p-4 bg-green-300 absolute opacity-90 top-3 left-0 right-0 m-auto z-100 flex items-center justify-center`,
        { transform: [{ translateY }] },
      ]}
    >
      <TouchableOpacity onPress={handlePress}>
        <View style={tw`flex items-center`}>
          <Text style={tw`text-base text-center text-gray-800`}>{message}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};
