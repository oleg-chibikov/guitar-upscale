import { ControlWithLabel } from "@/app/components/uiFramework/ControlWithLabel";
import { Slider } from "@/app/components/uiFramework/Slider";
import {
  selectSettings,
  setChordStrummingImmediateGracePeriodMs,
} from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";

export const ChordStrummingImmediateGracePeriodSlider: React.FC = () => {
  const { chordStrummingImmediateGracePeriodMs } = useSelector(selectSettings);
  const dispatch = useDispatch();

  const handleSliderChange = (value: number) => {
    dispatch(setChordStrummingImmediateGracePeriodMs(value));
  };

  return (
    <ControlWithLabel
      label="Immediate chord grace period duration"
      subtitle=" (Low values mean it would be easier to play single chords, but on the other hand higher chance of missing some initial notes in the strumming pattern (set to min if you only plan to play strumming without single chords)"
    >
      <Slider
        onValueChange={handleSliderChange}
        value={chordStrummingImmediateGracePeriodMs}
        minimumValue={0}
        maximumValue={1000}
        label={`${chordStrummingImmediateGracePeriodMs}ms`}
      />
    </ControlWithLabel>
  );
};
