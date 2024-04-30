import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectSettings,
  setSeamlessChordSwitching,
} from "../../../store/settingsSlice";
import { CheckBox } from "./CheckBox";

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
