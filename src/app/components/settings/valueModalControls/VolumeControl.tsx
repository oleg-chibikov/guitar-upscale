import { volumeSteps } from "@/app/data/volume";
import { selectSettings, setVolume } from "@/app/store/settingsSlice";
import VolumeUp from "@mui/icons-material/VolumeUp";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { ValueModalControl } from "./ValueModalControl";

export const VolumeControl: React.FC = () => {
  const { volume } = useSelector(selectSettings);
  const dispatch = useDispatch();

  const handleSliderChange = (value: number) => {
    dispatch(setVolume(value));
  };

  return (
    <ValueModalControl
      label="Volume"
      icon={<VolumeUp />}
      value={volume}
      setValue={handleSliderChange}
      steps={volumeSteps}
    />
  );
};
