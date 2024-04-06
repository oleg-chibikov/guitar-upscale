import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <TouchableOpacity onPress={handlePress}>
        <View style={styles.alert}>
          <Text style={styles.message}>{message}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    zIndex: 999,
    alignItems: "center",
  },
  alert: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 5,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  message: {
    fontSize: 16,
    color: "#333",
  },
});

export default AnimatedAlert;
