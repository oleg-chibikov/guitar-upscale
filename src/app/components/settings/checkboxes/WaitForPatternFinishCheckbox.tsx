import {
  selectSettings,
  setWaitForPatternFinish,
} from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { CheckBox } from "./CheckBox";

export const WaitForPatternFinishCheckbox: React.FC = (props) => {
  const { waitForPatternFinish } = useSelector(selectSettings);
  const dispatch = useDispatch();

  return (
    <CheckBox
      {...props}
      label="Wait for pattern to finish"
      value={waitForPatternFinish}
      onValueChange={(value: boolean) =>
        dispatch(setWaitForPatternFinish(value))
      }
    />
  );
};
