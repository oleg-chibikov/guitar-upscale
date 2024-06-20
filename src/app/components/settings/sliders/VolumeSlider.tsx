import { ControlWithLabel } from "@/app/components/layout/ControlWithLabel";
import { Note } from "@/app/data/notes";
import { MAX_VOLUME } from "@/app/data/volume";
import { beatToMilliseconds } from "@/app/engine/clock/mainClock";
import { playNote } from "@/app/engine/sound/soundProvider";
import { selectSettings, setVolume } from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Slider } from "./Slider";

export const VolumeSlider: React.FC = () => {
  const { volume, reverbStrength, instrument, tempoBpm } =
    useSelector(selectSettings);
  const dispatch = useDispatch();

  const handleSliderChange = async (value: number) => {
    dispatch(setVolume(value));
    await playNote(
      { note: Note.E, octave: 5 },
      value,
      instrument,
      reverbStrength,
      beatToMilliseconds(tempoBpm)
    );
  };

  return (
    <ControlWithLabel label="Playback volume">
      <Slider
        onValueChange={handleSliderChange}
        value={volume}
        minimumValue={1}
        maximumValue={MAX_VOLUME}
        step={1}
        label={volume.toString()}
      />
    </ControlWithLabel>
  );
};
