import { MAX_VELOCITY } from "@/app/data/notes";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectSettings,
  setMetronomeVelocity,
} from "../../../store/settingsSlice";
import { Slider } from "./Slider";

export const MetronomeVelocitySlider: React.FC = () => {
  const { metronomeVelocity } = useSelector(selectSettings);
  const dispatch = useDispatch();

  const handleSliderChange = async (value: number) => {
    dispatch(setMetronomeVelocity(value));
    const playMetronomeTick = (
      await import("@/app/engine/sound/metronomeProvider")
    ).playMetronomeTick;
    await playMetronomeTick(true, value);
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
