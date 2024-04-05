import React, { useEffect, useRef } from "react";
import { Animated, Dimensions } from "react-native";
import {
  HandlerStateChangeEvent,
  PanGestureHandler,
  PanGestureHandlerEventPayload,
  PinchGestureHandler,
  PinchGestureHandlerEventPayload,
  ScrollView,
  State,
} from "react-native-gesture-handler";
import { useScreenOrientation } from "../engine/useScreenOrientation";
import tw from "../tailwind";

interface PinchableBoxProps {
  children: React.ReactNode;
}

const PinchableBox: React.FC<PinchableBoxProps> = ({ children }) => {
  const orientation = useScreenOrientation();

  const baseScale = useRef(new Animated.Value(1)).current;
  const pinchScale = useRef(new Animated.Value(1)).current;
  const lastScale = useRef(1);
  let initialX = useRef(0).current;
  let initialY = useRef(0).current;
  let lastTranslateX = useRef(initialX).current;
  let lastTranslateY = useRef(initialY).current;

  useEffect(() => {
    console.log(orientation);
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    console.log(isTouchDevice ? "touch" : "mouse");
    const dimensions = Dimensions.get("screen");

    initialY = dimensions.height > 500 ? 50 : -10;
    initialX = dimensions.width < 1000 ? -150 : 0;
    lastTranslateX = initialX;
    lastTranslateY = initialY;
    onPanHandlerStateChange({
      nativeEvent: {
        oldState: State.ACTIVE,
        translationX: initialX,
        translationY: initialY,
      } as any,
    });
  }, [orientation]);
  const translateX = useRef(new Animated.Value(initialX)).current; // Initial X position set to -100
  const translateY = useRef(new Animated.Value(initialY)).current; // Initial Y position set to -100

  const scale = Animated.multiply(baseScale, pinchScale);

  const onPinchGestureEvent = Animated.event(
    [{ nativeEvent: { scale: pinchScale } }],
    { useNativeDriver: true }
  );

  const onPinchHandlerStateChange = (
    event: HandlerStateChangeEvent<PinchGestureHandlerEventPayload>
  ) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      lastScale.current *= event.nativeEvent.scale;
      baseScale.setValue(lastScale.current);
      pinchScale.setValue(1);
    }
  };

  const onPanGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationX: translateX,
          translationY: translateY,
        },
      },
    ],
    { useNativeDriver: true }
  );

  const onPanHandlerStateChange = (
    event: HandlerStateChangeEvent<PanGestureHandlerEventPayload>
  ) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      lastTranslateX += event.nativeEvent.translationX;
      lastTranslateY += event.nativeEvent.translationY;
      translateX.setOffset(lastTranslateX);
      translateX.setValue(0);
      translateY.setOffset(lastTranslateY);
      translateY.setValue(0);
    } else {
      translateX.setOffset(lastTranslateX);
      translateY.setOffset(lastTranslateY);
    }
  };

  return (
    <PinchGestureHandler
      onGestureEvent={onPinchGestureEvent}
      onHandlerStateChange={onPinchHandlerStateChange}
    >
      <PanGestureHandler
        onGestureEvent={onPanGestureEvent}
        onHandlerStateChange={onPanHandlerStateChange}
      >
        <ScrollView
          style={[tw`w-full h-full`, { minWidth: 2500 }]}
          maximumZoomScale={5}
          minimumZoomScale={1}
          showsHorizontalScrollIndicator={true}
          showsVerticalScrollIndicator={true}
        >
          <Animated.View
            style={{
              transform: [
                { translateX: translateX },
                { translateY: translateY },
                { scale: scale },
              ],
            }}
          >
            {children}
          </Animated.View>
        </ScrollView>
      </PanGestureHandler>
    </PinchGestureHandler>
  );
};

export default PinchableBox;
