import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, ScrollView } from "react-native";
import {
  HandlerStateChangeEvent,
  PanGestureHandler,
  PanGestureHandlerEventPayload,
  PinchGestureHandler,
  PinchGestureHandlerEventPayload,
  State,
} from "react-native-gesture-handler";
import { useSelector } from "react-redux";
import { useScreenOrientation } from "../engine/useScreenOrientation";
import { selectControlPanel } from "../store/controlPanelSlice";
import { tw } from "../tailwind";

interface PinchableBoxProps {
  children: React.ReactNode;
}

const minScale = 0.7;
const maxScale = 2;
const maxY = 40;
const minY = -80;

let initialX: number = 0;
let initialY: number = 0;
let lastTranslateX = 0;
let lastTranslateY = 0;
let lastScale = 1;
let baseScale = new Animated.Value(lastScale);
let pinchScale = new Animated.Value(lastScale);

export const PinchableBox: React.FC<PinchableBoxProps> = ({ children }) => {
  const { fretboardScaleX } = useSelector(selectControlPanel);
  const orientation = useScreenOrientation();

  // magic numbers!
  const widthLimit = 1000 / fretboardScaleX;
  const initialXBelowLimit = -150 / fretboardScaleX;
  const initialXAboveLimit = 0 / fretboardScaleX;
  const heightLimit = 500;
  const initialYBelowLimit = -10;
  const initialYAboveLimit = 50;

  const minXInterpolationForZoomOut = -800 / fretboardScaleX;
  const minXInterpolationForNoZoom = -1400 / fretboardScaleX;
  const minXInterpolationForZoomIn = -3000 / fretboardScaleX;

  const maxXInterpolationForZoomOut = -250 / fretboardScaleX;
  const maxXInterpolationForNoZoom = 50 / fretboardScaleX;
  const maxXInterpolationForZoomIn = -200 / fretboardScaleX;

  useEffect(() => {
    console.log(orientation);
    const dimensions = Dimensions.get("screen");

    initialX =
      dimensions.width < widthLimit ? initialXBelowLimit : initialXAboveLimit;
    initialY =
      dimensions.height > heightLimit ? initialYAboveLimit : initialYBelowLimit;
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

  function setTranslateXBasedOnScale(
    newTranslateX: number,
    translateX: Animated.Value
  ) {
    function interpolate(
      scale: number,
      x0: number,
      x1: number,
      y0: number,
      y1: number
    ) {
      return y0 + (y1 - y0) * ((scale - x0) / (x1 - x0));
    }

    const maxX =
      lastScale < 1
        ? interpolate(
            lastScale,
            minScale,
            1,
            maxXInterpolationForZoomOut,
            maxXInterpolationForNoZoom
          )
        : interpolate(
            lastScale,
            1,
            maxScale,
            maxXInterpolationForNoZoom,
            maxXInterpolationForZoomIn
          );

    const minX =
      lastScale < 1
        ? interpolate(
            lastScale,
            minScale,
            1,
            minXInterpolationForZoomOut,
            minXInterpolationForNoZoom
          )
        : interpolate(
            lastScale,
            1,
            maxScale,
            minXInterpolationForZoomIn,
            minXInterpolationForZoomIn
          );

    const clampedTranslateX = Math.max(minX, Math.min(maxX, newTranslateX));

    // Set the offset and value for X translation
    translateX.setOffset(clampedTranslateX);
    translateX.setValue(0);
    lastTranslateX = clampedTranslateX;
  }

  function setTranslateY(newTranslateY: number, translateY: Animated.Value) {
    const clampedTranslateY = Math.max(minY, Math.min(maxY, newTranslateY));

    // Set the offset and value for Y translation
    translateY.setOffset(clampedTranslateY);
    translateY.setValue(0);

    lastTranslateY = clampedTranslateY;
  }

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

      // Adjust TranslateX as it's dependent on scale
      setTranslateXBasedOnScale(lastTranslateX, translateX);
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
      const newTranslateX = lastTranslateX + event.nativeEvent.translationX;
      const newTranslateY = lastTranslateY + event.nativeEvent.translationY;

      // Clamp the translations within the limits
      setTranslateXBasedOnScale(newTranslateX, translateX);

      setTranslateY(newTranslateY, translateY);
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
          style={[tw`overflow-hidden w-full h-full`, { cursor: "move" }]}
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
