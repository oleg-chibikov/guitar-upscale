import {
  selectSettings,
  setSeamlessChordSwitching,
} from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { CheckBox } from "../../uiFramework/CheckBox";

export const SeamlessChordSwitchingCheckbox: React.FC = (props) => {
  const { seamlessChordSwitching } = useSelector(selectSettings);
  const dispatch = useDispatch();

  return (
    <CheckBox
      {...props}
      label="Chord switching amidst pattern"
      value={seamlessChordSwitching}
      onValueChange={(value: boolean) =>
        dispatch(setSeamlessChordSwitching(value))
      }
    />
  );
};
