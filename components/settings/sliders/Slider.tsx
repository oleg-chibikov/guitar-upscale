import React from "react";
import { View } from "react-native";

interface SliderProps {
  onValueChange: (value: number) => void;
  value: number;
  minimumValue: number;
  maximumValue: number;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  step?: number;
  style?: any; // or use specific styles
  isVertical?: boolean;
}

const Slider: React.FC<SliderProps> = ({
  onValueChange,
  value,
  minimumValue,
  maximumValue,
  step = 1,
  style,
  isVertical,
}) => {
  const props = isVertical ? { orient: "vertical" } : undefined; // firefox
  return (
    <View style={[{ width: "100%", alignItems: "center" }, style]}>
      <input
        type="range"
        {...props}
        min={minimumValue}
        max={maximumValue}
        value={value}
        step={step}
        onChange={(event) =>
          onValueChange && onValueChange(parseInt(event.target.value))
        }
        style={{
          width: isVertical ? 5 : "100%",
          height: isVertical ? "100%" : 5,
          cursor: "pointer",
          appearance: isVertical ? "slider-vertical" : ("none" as any),
          marginTop: 8,
        }}
      />
    </View>
  );
};

export { Slider };
