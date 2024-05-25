import { MAX_VOLUME, Note } from "@/app/data/notes";
import { beatToMilliseconds } from "@/app/engine/mainClock";
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
    <>
      <span>Playback volume:</span>
      <Slider
        onValueChange={handleSliderChange}
        value={volume}
        minimumValue={1}
        maximumValue={MAX_VOLUME}
        step={1}
        label={volume.toString()}
      />
    </>
  );
};
