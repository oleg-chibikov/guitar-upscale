import React from "react";
import { Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  maxYZoom,
  minYZoom,
  selectControlPanel,
  setFretboardScaleY,
} from "../../../store/controlPanelSlice";
import { tw } from "../../../tailwind";
import { Slider } from "./Slider";

export const FretboardScaleYSlider: React.FC = () => {
  const { fretboardScaleY, textStyle } = useSelector(selectControlPanel);
  const dispatch = useDispatch();

  const handleSliderChange = (value: number) => {
    dispatch(setFretboardScaleY(value / 10));
  };

  return (
    <View style={[tw`items-center flex flex-col gap-2`]}>
      <Slider
        onValueChange={handleSliderChange}
        value={fretboardScaleY * 10}
        minimumValue={minYZoom * 10}
        maximumValue={maxYZoom * 10}
        step={1}
        style={tw`h-32`}
        isVertical
      />
      <Text style={textStyle}>Y{(1 / fretboardScaleY).toFixed(2)}</Text>
    </View>
  );
};
