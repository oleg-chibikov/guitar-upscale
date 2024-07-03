import { ControlWithLabel } from "@/app/components/uiFramework/ControlWithLabel";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { setChordNotesToPlay } from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch } from "react-redux";
import { Slider } from "../../uiFramework/Slider";

export const ChordNotesToPlaySlider: React.FC = () => {
  const chordNotesToPlay = useSettingsSelector((s) => s.chordNotesToPlay);
  const stringCount = useSettingsSelector((s) => s.stringCount);
  const dispatch = useDispatch();

  const handleSliderChange = (value: number) => {
    dispatch(setChordNotesToPlay(value));
  };

  return (
    <ControlWithLabel label="Notes to play in chord">
      <Slider
        onValueChange={handleSliderChange}
        value={chordNotesToPlay}
        minimumValue={1}
        maximumValue={stringCount}
        step={1}
        label={chordNotesToPlay.toString()}
      />
    </ControlWithLabel>
  );
};
