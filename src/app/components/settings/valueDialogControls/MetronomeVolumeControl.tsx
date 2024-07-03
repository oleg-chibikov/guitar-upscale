import { MdiMetronome } from "@/app/components/playPanel/MetronomeButton";
import { ValueDialogControl } from "@/app/components/uiFramework/ValueDialogControl";
import { volumeSteps } from "@/app/data/volume";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { setMetronomeVolume } from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch } from "react-redux";

export const MetronomeVolumeControl: React.FC = () => {
  const metronomeVolume = useSettingsSelector((s) => s.metronomeVolume);
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
