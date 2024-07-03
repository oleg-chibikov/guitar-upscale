import { ControlWithLabel } from "@/app/components/uiFramework/ControlWithLabel";
import { Note } from "@/app/data/notes";
import { MAX_VOLUME } from "@/app/data/volume";
import { playNote } from "@/app/engine/sound/soundProvider";
import { beatToMilliseconds } from "@/app/helpers/clockHelper";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import {
  instrumentValue,
  reverbStrengthValue,
  setVolume,
  tempoBpmValue,
} from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch } from "react-redux";
import { Slider } from "../../uiFramework/Slider";

export const VolumeSlider: React.FC = () => {
  const volume = useSettingsSelector((s) => s.volume);
  const dispatch = useDispatch();

  const handleSliderChange = async (value: number) => {
    dispatch(setVolume(value));
    await playNote(
      { note: Note.E, octave: 5 },
      value,
      instrumentValue,
      reverbStrengthValue,
      beatToMilliseconds(tempoBpmValue)
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
