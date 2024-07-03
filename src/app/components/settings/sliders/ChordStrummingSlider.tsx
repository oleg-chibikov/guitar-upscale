import { ControlWithLabel } from "@/app/components/uiFramework/ControlWithLabel";
import { chordStrummingDelaySteps } from "@/app/data/chordStrummingDelaySteps";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { setChordStrummingDelayMs } from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch } from "react-redux";
import { StepSlider } from "../../uiFramework/StepSlider";

export const ChordStrummingDelaySlider: React.FC = () => {
  const chordStrummingDelayMs = useSettingsSelector(
    (s) => s.chordStrummingDelayMs
  );
  const dispatch = useDispatch();

  const handleSliderChange = (value: number) => {
    dispatch(setChordStrummingDelayMs(value));
  };

  return (
    <ControlWithLabel label="Chord strumming delay">
      <StepSlider
        onValueChange={handleSliderChange}
        value={chordStrummingDelayMs}
        steps={chordStrummingDelaySteps}
        label={`${chordStrummingDelayMs}ms`}
        labelClass="w-20"
      />
    </ControlWithLabel>
  );
};
