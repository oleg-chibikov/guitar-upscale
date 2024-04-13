import React from "react";
import { Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  maxXZoom,
  minXZoom,
  selectControlPanel,
  setFretboardScaleX,
} from "../../../store/controlPanelSlice";
import { tw } from "../../../tailwind";
import { Slider } from "./Slider";

export const FretboardScaleXSlider: React.FC = () => {
  const { fretboardScaleX, textStyle } = useSelector(selectControlPanel);
  const dispatch = useDispatch();

  const handleSliderChange = (value: number) => {
    dispatch(setFretboardScaleX(value / 10));
  };

  return (
    <View style={[tw`items-center flex flex-row gap-2`]}>
      <Slider
        onValueChange={handleSliderChange}
        value={fretboardScaleX * 10}
        minimumValue={minXZoom * 10}
        maximumValue={maxXZoom * 10}
        step={1}
        style={tw`w-32`}
      />
      <Text style={textStyle}>X{(1 / fretboardScaleX).toFixed(2)}</Text>
    </View>
  );
};
