import { MAX_VOLUME } from "@/app/data/notes";
import { selectSettings, setMetronomeVolume } from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Slider } from "./Slider";

export const MetronomeVolumeSlider: React.FC = () => {
  const { metronomeVolume } = useSelector(selectSettings);
  const dispatch = useDispatch();

  const handleSliderChange = async (value: number) => {
    dispatch(setMetronomeVolume(value));
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
        value={metronomeVolume}
        minimumValue={1}
        maximumValue={MAX_VOLUME}
        step={1}
        label={metronomeVolume.toString()}
      />
    </>
  );
};
