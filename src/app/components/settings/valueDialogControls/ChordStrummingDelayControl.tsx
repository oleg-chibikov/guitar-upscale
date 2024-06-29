import { ValueDialogControl } from "@/app/components/uiFramework/ValueDialogControl";
import { chordStrummingDelaySteps } from "@/app/data/chordStrummingDelaySteps";
import {
  selectSettings,
  setChordStrummingDelayMs,
} from "@/app/store/settingsSlice";
import Schedule from "@mui/icons-material/Schedule";
import React from "react";
import { useDispatch, useSelector } from "react-redux";

export const ChordStrummingDelayControl: React.FC = () => {
  const { chordStrummingDelayMs } = useSelector(selectSettings);
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
