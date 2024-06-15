import { selectSettings, setChordNotesToPlay } from "@/app/store/settingsSlice";
import { Typography } from "@mui/material";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Slider } from "./Slider";

export const ChordNotesToPlaySlider: React.FC = () => {
  const { chordNotesToPlay } = useSelector(selectSettings);
  const dispatch = useDispatch();

  const handleSliderChange = (value: number) => {
    dispatch(setChordNotesToPlay(value));
  };

  return (
    <>
      <Typography variant="body2">Notes to play in chord:</Typography>
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
