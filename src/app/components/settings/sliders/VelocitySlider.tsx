import { MAX_VELOCITY } from "@/app/data/notes";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectSettings, setVelocity } from "../../../store/settingsSlice";
import { Slider } from "./Slider";

export const VelocitySlider: React.FC = () => {
  const { velocity } = useSelector(selectSettings);
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
