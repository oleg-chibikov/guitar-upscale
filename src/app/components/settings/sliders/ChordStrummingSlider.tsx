import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectControlPanel,
  setChordStrummingDelayMs,
} from "../../../store/controlPanelSlice";
import { Slider } from "./Slider";

export const ChordStrummingDelaySlider: React.FC = () => {
  const { chordStrummingDelayMs } = useSelector(selectControlPanel);
  const dispatch = useDispatch();

  const handleSliderChange = (value: number) => {
    dispatch(setChordStrummingDelayMs(value));
  };

  return (
    <>
      <span>Chord strumming delay:</span>
      <Slider
        onValueChange={handleSliderChange}
        value={chordStrummingDelayMs}
        minimumValue={0}
        maximumValue={500}
        step={1}
        label={`${chordStrummingDelayMs}ms`}
        labelClass="w-20"
      />
    </>
  );
};
