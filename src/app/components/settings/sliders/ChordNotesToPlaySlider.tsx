import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectSettings,
  setChordNotesToPlay,
} from "../../../store/settingsSlice";
import { Slider } from "./Slider";

export const ChordNotesToPlaySlider: React.FC = () => {
  const { chordNotesToPlay } = useSelector(selectSettings);
  const dispatch = useDispatch();

  const handleSliderChange = (value: number) => {
    dispatch(setChordNotesToPlay(value));
  };

  return (
    <>
      <span>Notes to play in chord:</span>
      <Slider
        onValueChange={handleSliderChange}
        value={chordNotesToPlay}
        minimumValue={1}
        maximumValue={6}
        step={1}
        label={chordNotesToPlay.toString()}
      />
    </>
  );
};
