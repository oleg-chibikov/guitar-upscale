import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectControlPanel,
  setVelocity,
} from "../../../store/controlPanelSlice";
import { Slider } from "./Slider";

export const VelocitySlider: React.FC = () => {
  const { velocity, textStyle } = useSelector(selectControlPanel);
  const dispatch = useDispatch();

  const handleSliderChange = (value: number) => {
    dispatch(setVelocity(value));
  };

  return (
    <div className="items-center flex flex-row gap-2">
      <Slider
        onValueChange={handleSliderChange}
        value={velocity}
        minimumValue={1}
        maximumValue={125}
        step={1}
        className="w-48"
      />
      <span className={textStyle}>{velocity}</span>
    </div>
  );
};
