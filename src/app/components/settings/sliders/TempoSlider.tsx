import { ControlWithLabel } from "@/app/components/uiFramework/ControlWithLabel";
import { tempoSteps } from "@/app/data/tempo";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { setTempoBpm } from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch } from "react-redux";
import { StepSlider } from "../../uiFramework/StepSlider";

export const TempoSlider: React.FC = () => {
  const tempoBpm = useSettingsSelector((s) => s.tempoBpm);
  const dispatch = useDispatch();

  const handleSliderChange = (value: number) => {
    dispatch(setTempoBpm({ tempo: value, updateInterval: true }));
  };

  return (
    <ControlWithLabel label="Tempo">
      <StepSlider
        onValueChange={handleSliderChange}
        value={tempoBpm}
        steps={tempoSteps}
        label={`${tempoBpm} BPM`}
        labelClass="w-20"
      />
    </ControlWithLabel>
  );
};
