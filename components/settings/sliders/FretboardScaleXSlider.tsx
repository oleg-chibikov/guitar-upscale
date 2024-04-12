import React from "react";
import { Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
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
    <View style={[tw`items-center flex flex-col gap-2`]}>
      <Slider
        onValueChange={handleSliderChange}
        value={fretboardScaleX * 10}
        minimumValue={10}
        maximumValue={30}
        step={1}
        style={tw`h-32`}
        isVertical
      />
      <Text style={textStyle}>{fretboardScaleX}</Text>
    </View>
  );
};
