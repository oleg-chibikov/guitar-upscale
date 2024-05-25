import { MdiMetronome } from "@/app/components/settings/buttons/MetronomeButton";
import { volumeSteps } from "@/app/data/volume";
import { selectSettings, setMetronomeVolume } from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { ValueModalControl } from "./ValueModalControl";

export const MetronomeVolumeControl: React.FC = () => {
  const { metronomeVolume } = useSelector(selectSettings);
  const dispatch = useDispatch();

  const handleSliderChange = (value: number) => {
    dispatch(setMetronomeVolume(value));
  };

  return (
    <ValueModalControl
      label="Metronome volume"
      icon={<MdiMetronome />}
      value={metronomeVolume}
      setValue={handleSliderChange}
      steps={volumeSteps}
    />
  );
};
