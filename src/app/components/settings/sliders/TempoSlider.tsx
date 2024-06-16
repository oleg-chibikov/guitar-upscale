import { ControlWithLabel } from "@/app/components/layout/ControlWithLabel";
import { tempoSteps } from "@/app/data/tempo";
import { selectSettings, setTempoBpm } from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { StepSlider } from "./StepSlider";

export const TempoSlider: React.FC = () => {
  const { tempoBpm } = useSelector(selectSettings);
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
