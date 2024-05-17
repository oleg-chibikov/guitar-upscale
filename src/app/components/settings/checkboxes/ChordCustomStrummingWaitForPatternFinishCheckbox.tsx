import {
  selectSettings,
  setChordCustomStrummingWaitForPatternFinish,
} from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
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
