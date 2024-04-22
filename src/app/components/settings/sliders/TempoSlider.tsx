import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectSettings, setTempoBpm } from "../../../store/settingsSlice";
import { Slider } from "./Slider";

export const TempoSlider: React.FC = () => {
  const { tempoBpm } = useSelector(selectSettings);
  const dispatch = useDispatch();

  const handleSliderChange = (value: number) => {
    dispatch(setTempoBpm(value));
  };

  return (
    <>
      <span>Playback speed:</span>
      <Slider
        onValueChange={handleSliderChange}
        value={tempoBpm}
        minimumValue={50}
        maximumValue={500}
        step={1}
        label={`${tempoBpm} BPM`}
        labelClass="w-20"
      />
    </>
  );
};
