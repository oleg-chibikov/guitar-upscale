import { MAX_VELOCITY, Note } from "@/app/data/notes";
import { playNote } from "@/app/engine/sound/soundProvider";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectSettings, setVelocity } from "../../../store/settingsSlice";
import { Slider } from "./Slider";

export const VelocitySlider: React.FC = () => {
  const { velocity, reverbStrength, instrument } = useSelector(selectSettings);
  const dispatch = useDispatch();

  const handleSliderChange = async (value: number) => {
    dispatch(setVelocity(value));
    await playNote(
      { note: Note.E, octave: 5 },
      value,
      instrument,
      reverbStrength
    );
  };

  return (
    <>
      <span>Playback volume:</span>
      <Slider
        onValueChange={handleSliderChange}
        value={velocity}
        minimumValue={1}
        maximumValue={MAX_VELOCITY}
        step={1}
        label={velocity.toString()}
      />
    </>
  );
};
