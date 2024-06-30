import { ControlWithLabel } from "@/app/components/uiFramework/ControlWithLabel";
import { selectSettings, setChordNotesToPlay } from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Slider } from "../../uiFramework/Slider";

export const ChordNotesToPlaySlider: React.FC = () => {
  const { chordNotesToPlay, stringCount } = useSelector(selectSettings);
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
