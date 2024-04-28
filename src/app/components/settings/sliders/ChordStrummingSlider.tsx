import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectSettings,
  setChordStrummingDelayMs,
} from "../../../store/settingsSlice";
import { StepSlider } from "./ExpoStepSlider";

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
        minimumValue={0}
        maximumValue={500}
        steps={[
          0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 50, 75, 100, 250,
          500,
        ]}
        label={`${chordStrummingDelayMs}ms`}
        labelClass="w-20"
      />
    </>
  );
};
