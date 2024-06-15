import {
  maxYZoom,
  minYZoom,
  selectUi,
  setFretboardScaleY,
} from "@/app/store/uiSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Slider } from "../settings/sliders/Slider";

export const FretboardScaleYSlider: React.FC = () => {
  const { fretboardScaleY } = useSelector(selectUi);
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
      className="h-48 px-3 py-1"
      isVertical
    />
  );
};
