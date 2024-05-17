"use client";

import { selectSettings, setReverbStrength } from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Slider } from "./Slider";

export const ReverbStrengthSlider: React.FC = () => {
  const { reverbStrength } = useSelector(selectSettings);
  const dispatch = useDispatch();

  const handleSliderChange = (value: number) => {
    dispatch(setReverbStrength(value / 10));
  };

  return (
    <>
      <span>Reverb strength:</span>
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
