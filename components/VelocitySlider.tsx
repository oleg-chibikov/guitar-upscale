import React from "react";
import { Text, View } from "react-native";
import { useDispatch } from "react-redux";
import { setVelocity } from "../store/controlPanelSlice";
import { useAppSelector } from "../store/store";
import tw from "../tailwind";
import { Slider } from "./Slider";

const VelocitySlider: React.FC = () => {
  const { velocity } = useAppSelector((state) => state.controlPanel);
  const dispatch = useDispatch();

  const handleSliderChange = (value: number) => {
    dispatch(setVelocity(value));
  };

  return (
    <View style={[tw`items-center flex flex-row gap-2`]}>
      <Slider
        onValueChange={handleSliderChange}
        value={velocity}
        minimumValue={1}
        maximumValue={125}
        step={1}
        style={tw`w-48`}
      />
      <Text style={tw`text-md`}>{velocity}</Text>
    </View>
  );
};

export default VelocitySlider;
