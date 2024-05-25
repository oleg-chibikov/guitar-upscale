import { chordStrummingDelaySteps } from "@/app/data/chordStrummingInterval";
import {
  selectSettings,
  setChordStrummingDelayMs,
} from "@/app/store/settingsSlice";
import Schedule from "@mui/icons-material/Schedule";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { ValueModalControl } from "./ValueModalControl";

export const ChordStrummingDelayControl: React.FC = () => {
  const { chordStrummingDelayMs } = useSelector(selectSettings);
  const dispatch = useDispatch();

  const handleSliderChange = (value: number) => {
    dispatch(setChordStrummingDelayMs(value));
  };

  return (
    <ValueModalControl
      label="Delay between notes in chord"
      icon={<Schedule />}
      value={chordStrummingDelayMs}
      setValue={handleSliderChange}
      postfix="ms"
      steps={chordStrummingDelaySteps}
    />
  );
};
