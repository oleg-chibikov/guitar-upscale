import {
  maxXZoom,
  minXZoom,
  selectUi,
  setFretboardScaleX,
} from "@/app/store/uiSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Slider } from "./Slider";

export const FretboardScaleXSlider: React.FC = () => {
  const { fretboardScaleX } = useSelector(selectUi);
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
      className="w-52 py-2"
    />
  );
};
