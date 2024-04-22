"use client";

import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectSettings,
  setReverbStrength,
} from "../../../store/settingsSlice";
import { Slider } from "./Slider";

export const ReverbStrengthSlider: React.FC = () => {
  const { reverbStrength } = useSelector(selectSettings);
  const dispatch = useDispatch();

  const handleSliderChange = (value: number) => {
    dispatch(setReverbStrength(value / 10));
  };

  return (
    <>
      <span>Reverb strenght:</span>
      <Slider
        onValueChange={handleSliderChange}
        value={reverbStrength * 10}
        minimumValue={0}
        maximumValue={10}
        step={1}
        label={reverbStrength.toString()}
      />
    </>
  );
};
