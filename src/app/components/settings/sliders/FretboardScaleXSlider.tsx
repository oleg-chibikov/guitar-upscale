import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  maxXZoom,
  minXZoom,
  selectControlPanel,
  setFretboardScaleX,
} from "../../../store/controlPanelSlice";
import { Slider } from "./Slider";

export const FretboardScaleXSlider: React.FC = () => {
  const { fretboardScaleX, textStyle } = useSelector(selectControlPanel);
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
      className="w-32"
      label={`X${(1 / fretboardScaleX).toFixed(2)}`}
    />
  );
};
