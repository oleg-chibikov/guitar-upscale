import { MAX_VELOCITY } from "@/app/data/notes";
import {
  selectSettings,
  setMetronomeVelocity,
} from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Slider } from "./Slider";

export const MetronomeVelocitySlider: React.FC = () => {
  const { metronomeVelocity } = useSelector(selectSettings);
  const dispatch = useDispatch();

  const handleSliderChange = async (value: number) => {
    dispatch(setMetronomeVelocity(value));
    const playMetronomeBeat = (
      await import("@/app/engine/sound/metronomeProvider")
    ).playMetronomeBeat;
    await playMetronomeBeat(true, value);
  };

  return (
    <>
      <span>Metronome volume:</span>
      <Slider
        onValueChange={handleSliderChange}
        value={metronomeVelocity}
        minimumValue={1}
        maximumValue={MAX_VELOCITY}
        step={1}
        label={metronomeVelocity.toString()}
      />
    </>
  );
};
