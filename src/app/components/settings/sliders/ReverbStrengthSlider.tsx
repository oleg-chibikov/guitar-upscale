"use client";

import { ControlWithLabel } from "@/app/components/uiFramework/ControlWithLabel";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { setReverbStrength } from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch } from "react-redux";
import { Slider } from "../../uiFramework/Slider";

export const ReverbStrengthSlider: React.FC = () => {
  const reverbStrength = useSettingsSelector((s) => s.reverbStrength);
  const dispatch = useDispatch();

  const handleSliderChange = (value: number) => {
    dispatch(setReverbStrength(value / 10));
  };

  return (
    <ControlWithLabel label="Reverb strength">
      <Slider
        onValueChange={handleSliderChange}
        value={reverbStrength * 10}
        minimumValue={0}
        maximumValue={10}
        step={1}
        label={reverbStrength.toString()}
      />
    </ControlWithLabel>
  );
};
