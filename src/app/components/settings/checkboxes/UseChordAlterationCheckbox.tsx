import {
  selectSettings,
  setUseChordAlteration,
} from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { CheckBox } from "../../uiFramework/CheckBox";

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
