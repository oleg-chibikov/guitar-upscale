import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectSettings,
  setChordCustomStrummingWaitForPatternFinish,
} from "../../../store/settingsSlice";
import { CheckBox } from "./CheckBox";

export const ChordCustomStrummingWaitForPatternFinishCheckbox: React.FC = (
  props
) => {
  const { chordCustomStrummingWaitForPatternFinish } =
    useSelector(selectSettings);
  const dispatch = useDispatch();

  return (
    <CheckBox
      {...props}
      label="Wait for pattern to finish"
      value={chordCustomStrummingWaitForPatternFinish}
      onValueChange={(value: boolean) =>
        dispatch(setChordCustomStrummingWaitForPatternFinish(value))
      }
    />
  );
};
