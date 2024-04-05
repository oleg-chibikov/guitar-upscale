import React from "react";
import { Text, View } from "react-native";
import { Slider } from "react-native-awesome-slider";
import { useSharedValue } from "react-native-reanimated";
import { useDispatch } from "react-redux";
import { setPlayIntervalMs } from "../store/controlPanelSlice";
import { useAppSelector } from "../store/store";
import tw from "../tailwind";

const PlayIntervalSlider: React.FC = () => {
  const { playIntervalMs } = useAppSelector((state) => state.controlPanel);
  const dispatch = useDispatch();

  const handleSliderChange = (value: number) => {
    dispatch(setPlayIntervalMs(value));
  };
  const progress = useSharedValue(playIntervalMs);
  const min = useSharedValue(50);
  const max = useSharedValue(2000);
  return (
    <View style={[tw`items-center flex flex-row gap-2`]}>
      <Slider
        renderMark={() => null}
        renderBubble={() => null}
        onValueChange={handleSliderChange}
        progress={progress}
        minimumValue={min}
        maximumValue={max}
        step={25}
        snapToStep={true}
        theme={{
          maximumTrackTintColor: "#9A9A9A",
          minimumTrackTintColor: "#5497EA",
        }}
      />
      <Text style={tw`text-md`}>{playIntervalMs}</Text>
    </View>
  );
};

export default PlayIntervalSlider;
