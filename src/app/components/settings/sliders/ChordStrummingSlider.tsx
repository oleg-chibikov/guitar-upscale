import { chordStrummingDelaySteps } from "@/app/data/chordStrummingInterval";
import {
  selectSettings,
  setChordStrummingDelayMs,
} from "@/app/store/settingsSlice";
import { Typography } from "@mui/material";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { StepSlider } from "./StepSlider";

export const ChordStrummingDelaySlider: React.FC = () => {
  const { chordStrummingDelayMs } = useSelector(selectSettings);
  const dispatch = useDispatch();

  const handleSliderChange = (value: number) => {
    dispatch(setChordStrummingDelayMs(value));
  };

  return (
    <>
      <Typography variant="body2">Chord strumming delay:</Typography>
      <StepSlider
        onValueChange={handleSliderChange}
        value={chordStrummingDelayMs}
        steps={chordStrummingDelaySteps}
        label={`${chordStrummingDelayMs}ms`}
        labelClass="w-20"
      />
    </>
  );
};
