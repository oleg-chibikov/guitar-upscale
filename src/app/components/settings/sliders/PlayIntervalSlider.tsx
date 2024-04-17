import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectControlPanel,
  setPlayIntervalBpm,
} from "../../../store/controlPanelSlice";
import { Slider } from "./Slider";

export const PlayIntervalSlider: React.FC = () => {
  const { playIntervalBpm } = useSelector(selectControlPanel);
  const dispatch = useDispatch();

  const handleSliderChange = (value: number) => {
    dispatch(setPlayIntervalBpm(value));
  };

  return (
    <Slider
      onValueChange={handleSliderChange}
      value={playIntervalBpm}
      minimumValue={50}
      maximumValue={500}
      step={1}
      label={`${playIntervalBpm} BPM`}
      labelClass="w-20"
    />
  );
};
