import React, { useEffect, useRef } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import tw from "../tailwind";

interface AnimatedAlertProps {
  message: string;
  onClose: () => void;
}

const AnimatedAlert: React.FC<AnimatedAlertProps> = ({ message, onClose }) => {
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
        tw`absolute top-3 left-20 right-20 z-10 flex items-center`,
        { transform: [{ translateY }] },
      ]}
    >
      <TouchableOpacity onPress={handlePress}>
        <View style={tw`bg-white p-4 rounded-md flex items-center`}>
          <Text style={tw`text-base text-gray-800`}>{message}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default AnimatedAlert;
