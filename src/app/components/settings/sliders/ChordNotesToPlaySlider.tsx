import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectControlPanel,
  setChordNotesToPlay,
} from "../../../store/controlPanelSlice";
import { Slider } from "./Slider";

export const ChordNotesToPlaySlider: React.FC = () => {
  const { chordNotesToPlay, textStyle } = useSelector(selectControlPanel);
  const dispatch = useDispatch();

  const handleSliderChange = (value: number) => {
    dispatch(setChordNotesToPlay(value));
  };

  return (
    <Slider
      onValueChange={handleSliderChange}
      value={chordNotesToPlay}
      minimumValue={1}
      maximumValue={6}
      step={1}
      className="w-48"
      label={chordNotesToPlay.toString()}
    />
  );
};
