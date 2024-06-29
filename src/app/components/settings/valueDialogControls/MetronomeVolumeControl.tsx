import { MdiMetronome } from "@/app/components/playPanel/MetronomeButton";
import { volumeSteps } from "@/app/data/volume";
import { selectSettings, setMetronomeVolume } from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { ValueDialogControl } from "./ValueDialogControl";

export const MetronomeVolumeControl: React.FC = () => {
  const { metronomeVolume } = useSelector(selectSettings);
  const dispatch = useDispatch();

  const handleSliderChange = (value: number) => {
    dispatch(setMetronomeVolume(value));
  };

  return (
    <ValueDialogControl
      label="Metronome volume"
      icon={<MdiMetronome />}
      value={metronomeVolume}
      setValue={handleSliderChange}
      steps={volumeSteps}
    />
  );
};
