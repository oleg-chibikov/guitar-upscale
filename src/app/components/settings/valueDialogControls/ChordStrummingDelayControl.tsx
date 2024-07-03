import { ValueDialogControl } from "@/app/components/uiFramework/ValueDialogControl";
import { chordStrummingDelaySteps } from "@/app/data/chordStrummingDelaySteps";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { setChordStrummingDelayMs } from "@/app/store/settingsSlice";
import Schedule from "@mui/icons-material/Schedule";
import React from "react";
import { useDispatch } from "react-redux";

export const ChordStrummingDelayControl: React.FC = () => {
  const chordStrummingDelayMs = useSettingsSelector(
    (s) => s.chordStrummingDelayMs
  );
  const dispatch = useDispatch();

  const handleSliderChange = (value: number) => {
    dispatch(setChordStrummingDelayMs(value));
  };

  return (
    <ValueDialogControl
      label="Delay between notes in chord"
      icon={<Schedule />}
      value={chordStrummingDelayMs}
      setValue={handleSliderChange}
      postfix="ms"
      steps={chordStrummingDelaySteps}
    />
  );
};
