import { tempoSteps } from "@/app/data/tempo";
import { selectSettings, setTempoBpm } from "@/app/store/settingsSlice";
import { Typography } from "@mui/material";
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
    <>
      <Typography variant="body2">Tempo:</Typography>
      <StepSlider
        onValueChange={handleSliderChange}
        value={tempoBpm}
        steps={tempoSteps}
        label={`${tempoBpm} BPM`}
        labelClass="w-20"
      />
    </>
  );
};
