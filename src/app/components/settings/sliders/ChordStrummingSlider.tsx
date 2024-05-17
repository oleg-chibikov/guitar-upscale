import {
  selectSettings,
  setChordStrummingDelayMs,
} from "@/app/store/settingsSlice";
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
      <span>Chord strumming delay:</span>
      <StepSlider
        onValueChange={handleSliderChange}
        value={chordStrummingDelayMs}
        steps={[
          0, 2, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 75, 100, 125, 150, 175,
          200, 250, 300, 350, 400, 450, 500,
        ]}
        label={`${chordStrummingDelayMs}ms`}
        labelClass="w-20"
      />
    </>
  );
};
