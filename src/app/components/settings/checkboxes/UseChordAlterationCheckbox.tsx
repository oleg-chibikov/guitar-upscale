import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectSettings,
  setUseChordAlteration,
} from "../../../store/settingsSlice";
import { CheckBox } from "./CheckBox";

export const UseChordAlterationCheckbox: React.FC = (props) => {
  const { useChordAlteration } = useSelector(selectSettings);
  const dispatch = useDispatch();

  return (
    <CheckBox
      {...props}
      label="Alternate chords (↑↓)"
      value={useChordAlteration}
      onValueChange={(value: boolean) => dispatch(setUseChordAlteration(value))}
    />
  );
};
