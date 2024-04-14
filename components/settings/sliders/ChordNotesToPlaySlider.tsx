import React from "react";
import { Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  selectControlPanel,
  setChordNotesToPlay,
} from "../../../store/controlPanelSlice";
import { tw } from "../../../tailwind";
import { Slider } from "./Slider";

export const ChordNotesToPlaySlider: React.FC = () => {
  const { chordNotesToPlay, textStyle } = useSelector(selectControlPanel);
  const dispatch = useDispatch();

  const handleSliderChange = (value: number) => {
    dispatch(setChordNotesToPlay(value));
  };

  return (
    <View style={[tw`ite-center flex flex-row gap-2`]}>
      <Slider
        onValueChange={handleSliderChange}
        value={chordNotesToPlay}
        minimumValue={1}
        maximumValue={6}
        step={1}
        style={tw`w-48`}
      />
      <Text style={textStyle}>{chordNotesToPlay}</Text>
    </View>
  );
};
