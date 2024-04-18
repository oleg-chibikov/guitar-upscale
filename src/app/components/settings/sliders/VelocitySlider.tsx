import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectControlPanel,
  setVelocity,
} from "../../../store/controlPanelSlice";
import { Slider } from "./Slider";

export const VelocitySlider: React.FC = () => {
  const { velocity } = useSelector(selectControlPanel);
  const dispatch = useDispatch();

  const handleSliderChange = (value: number) => {
    dispatch(setVelocity(value));
  };

  return (
    <Slider
      onValueChange={handleSliderChange}
      value={velocity}
      minimumValue={1}
      maximumValue={127}
      step={1}
      label={velocity.toString()}
    />
  );
};
