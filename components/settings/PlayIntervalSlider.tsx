import React from "react";
import { Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  selectControlPanel,
  setPlayIntervalBpm,
} from "../../store/controlPanelSlice";
import { tw } from "../../tailwind";
import { Slider } from "../core/Slider";

export const PlayIntervalSlider: React.FC = () => {
  const { playIntervalBpm, textStyle } = useSelector(selectControlPanel);
  const dispatch = useDispatch();

  const handleSliderChange = (value: number) => {
    dispatch(setPlayIntervalBpm(value));
  };

  return (
    <View style={[tw`items-center flex flex-row gap-2`]}>
      <Slider
        onValueChange={handleSliderChange}
        value={playIntervalBpm}
        minimumValue={50}
        maximumValue={500}
        step={1}
        style={tw`w-48`}
      />
      <Text style={textStyle}>{playIntervalBpm} BPM</Text>
    </View>
  );
};
