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
}

const Slider: React.FC<SliderProps> = ({
  onValueChange,
  value,
  minimumValue,
  maximumValue,
  step = 1,
  style,
}) => {
  return (
    <View style={[{ width: "100%", alignItems: "stretch" }, style]}>
      <input
        type="range"
        min={minimumValue}
        max={maximumValue}
        value={value}
        step={step}
        onChange={(event) =>
          onValueChange && onValueChange(parseInt(event.target.value))
        }
        style={{
          width: "100%",
          height: 5,
          cursor: "pointer",
          appearance: "none",
          marginTop: 8,
        }}
      />
    </View>
  );
};

export { Slider };
