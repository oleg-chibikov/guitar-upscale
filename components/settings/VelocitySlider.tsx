import React from "react";
import { Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { selectControlPanel, setVelocity } from "../../store/controlPanelSlice";
import { tw } from "../../tailwind";
import { Slider } from "../core/Slider";

export const VelocitySlider: React.FC = () => {
  const { velocity, textStyle } = useSelector(selectControlPanel);
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
      <Text style={textStyle}>{velocity}</Text>
    </View>
  );
};
