import { useUiSelector } from "@/app/hooks/storeHooks";
import { maxXZoom, minXZoom, setFretboardScaleX } from "@/app/store/uiSlice";
import React from "react";
import { useDispatch } from "react-redux";
import { Slider } from "../uiFramework/Slider";

export const FretboardScaleXSlider: React.FC = () => {
  const fretboardScaleX = useUiSelector((s) => s.fretboardScaleX);
  const dispatch = useDispatch();

  const handleSliderChange = (value: number) => {
    dispatch(setFretboardScaleX(value / 10));
  };

  return (
    <Slider
      onValueChange={handleSliderChange}
      value={fretboardScaleX * 10}
      minimumValue={minXZoom * 10}
      maximumValue={maxXZoom * 10}
      step={1}
      className={`w-full px-1 py-2`}
    />
  );
};
