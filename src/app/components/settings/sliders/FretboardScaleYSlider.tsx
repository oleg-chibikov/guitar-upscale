import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  maxYZoom,
  minYZoom,
  selectControlPanel,
  setFretboardScaleY,
} from "../../../store/controlPanelSlice";
import { Slider } from "./Slider";

export const FretboardScaleYSlider: React.FC = () => {
  const { fretboardScaleY, textStyle } = useSelector(selectControlPanel);
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
      className="h-32 px-2"
      isVertical
      label={`Y${(1 / fretboardScaleY).toFixed(2)}`}
    />
  );
};
