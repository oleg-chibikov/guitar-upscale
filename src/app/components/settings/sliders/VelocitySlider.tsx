import { MAX_VELOCITY } from "@/app/data/notes";
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
    <>
      <span>Playback volume:</span>
      <Slider
        onValueChange={handleSliderChange}
        value={velocity}
        minimumValue={1}
        maximumValue={MAX_VELOCITY}
        step={1}
        label={velocity.toString()}
      />
    </>
  );
};
