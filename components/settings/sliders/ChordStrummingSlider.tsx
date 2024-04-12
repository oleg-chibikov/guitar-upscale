import React from "react";
import { Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  selectControlPanel,
  setChordStrummingDelayMs,
} from "../../../store/controlPanelSlice";
import { tw } from "../../../tailwind";
import { Slider } from "./Slider";

export const ChordStrummingDelaySlider: React.FC = () => {
  const { chordStrummingDelayMs, textStyle } = useSelector(selectControlPanel);
  const dispatch = useDispatch();

  const handleSliderChange = (value: number) => {
    dispatch(setChordStrummingDelayMs(value));
  };

  return (
    <View style={[tw`items-center flex flex-row gap-2`]}>
      <Slider
        onValueChange={handleSliderChange}
        value={chordStrummingDelayMs}
        minimumValue={0}
        maximumValue={500}
        step={1}
        style={tw`w-48`}
      />
      <Text style={textStyle}>{chordStrummingDelayMs}ms</Text>
    </View>
  );
};
