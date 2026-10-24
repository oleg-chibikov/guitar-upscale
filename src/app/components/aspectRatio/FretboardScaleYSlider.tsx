import { useUiSelector } from "@/app/hooks/storeHooks";
import { maxYZoom, minYZoom } from "@/app/data/fretboardZoomLimits";
import { setFretboardScaleY } from "@/app/store/uiSlice";
import React from "react";
import { useDispatch } from "react-redux";
import { Slider } from "../uiFramework/Slider";

export const FretboardScaleYSlider: React.FC = () => {
  const fretboardScaleY = useUiSelector((s) => s.fretboardScaleY);
  const dispatch = useDispatch();

  const handleSliderChange = (value: number) => {
    dispatch(setFretboardScaleY(value / 10));
  };

  return (
    <Slider
      onValueChange={handleSliderChange}
      value={fretboardScaleY * 10}
      minimumValue={minYZoom * 10}
      maximumValue={maxYZoom * 10}
      step={1}
      className="h-full px-2 py-1"
      isVertical
    />
  );
};
