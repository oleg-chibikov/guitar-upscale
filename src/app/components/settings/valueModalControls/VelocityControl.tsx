import { MAX_VELOCITY } from "@/app/data/notes";
import { selectSettings, setVelocity } from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { ValueModalControl } from "./ValueModalControl";

const volumeSteps: number[] = Array.from(Array(MAX_VELOCITY + 1).keys());

export const VolumeControl: React.FC = () => {
  const { velocity } = useSelector(selectSettings);
  const dispatch = useDispatch();

  const handleSliderChange = (value: number) => {
    dispatch(setVelocity(value));
  };

  return (
    <ValueModalControl
      value={velocity}
      setValue={handleSliderChange}
      steps={volumeSteps}
      formatValue={(value) => "🔊" + value}
    />
  );
};
