import { MAX_VOLUME } from "@/app/data/notes";
import { selectSettings, setVolume } from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { ValueModalControl } from "./ValueModalControl";

const volumeSteps: number[] = Array.from(Array(MAX_VOLUME + 1).keys());

export const VolumeControl: React.FC = () => {
  const { volume } = useSelector(selectSettings);
  const dispatch = useDispatch();

  const handleSliderChange = (value: number) => {
    dispatch(setVolume(value));
  };

  return (
    <ValueModalControl
      value={volume}
      setValue={handleSliderChange}
      steps={volumeSteps}
      formatValue={(value) => "🔊" + value}
    />
  );
};
