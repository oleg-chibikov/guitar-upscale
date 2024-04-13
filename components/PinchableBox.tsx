import React from "react";
import { Animated, ScrollView } from "react-native";
import {
  HandlerStateChangeEvent,
  PinchGestureHandler,
  PinchGestureHandlerEventPayload,
  State,
} from "react-native-gesture-handler";
import { tw } from "../tailwind";

interface PinchableBoxProps {
  children: React.ReactNode;
}

const minScale = 0.7;
const maxScale = 2;

let lastScale = 1;
let baseScale = new Animated.Value(lastScale);
let pinchScale = new Animated.Value(lastScale);

export const PinchableBox: React.FC<PinchableBoxProps> = ({ children }) => {
  const scale = Animated.multiply(baseScale, pinchScale);

  const onPinchGestureEvent = Animated.event(
    [{ nativeEvent: { scale: pinchScale } }],
    { useNativeDriver: true }
  );

  const onPinchHandlerStateChange = (
    event: HandlerStateChangeEvent<PinchGestureHandlerEventPayload>
  ) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      // Calculate the new scale value
      const newScale = lastScale * event.nativeEvent.scale;

      // Clamp the scale within the limits
      const clampedScale = Math.max(minScale, Math.min(maxScale, newScale));

      // Set the base scale value to the clamped scale
      baseScale.setValue(clampedScale);

      // Reset pinch scale value
      pinchScale.setValue(1);

      // Update last scale value
      lastScale = clampedScale;
    }
  };

  return (
    <PinchGestureHandler
      onGestureEvent={onPinchGestureEvent}
      onHandlerStateChange={onPinchHandlerStateChange}
    >
      <ScrollView style={[tw`w-full h-full`]}>
        <Animated.View
          style={{
            transform: [{ scale: scale }],
          }}
        >
          {children}
        </Animated.View>
      </ScrollView>
    </PinchGestureHandler>
  );
};
