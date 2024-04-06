import Slider from "@react-native-community/slider";
import React from "react";
import { Text, View } from "react-native";
import { useDispatch } from "react-redux";
import { setPlayIntervalBpm } from "../store/controlPanelSlice";
import { useAppSelector } from "../store/store";
import tw from "../tailwind";

const PlayIntervalSlider: React.FC = () => {
  const { playIntervalBpm } = useAppSelector((state) => state.controlPanel);
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
        minimumTrackTintColor="#FFFFFF"
        maximumTrackTintColor="#b5b5b5"
        step={1}
        style={tw`w-48`}
      />
      <Text style={tw`text-md`}>{playIntervalBpm} BPM</Text>
    </View>
  );
};

export default PlayIntervalSlider;
