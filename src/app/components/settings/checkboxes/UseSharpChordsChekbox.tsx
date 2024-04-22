"useClient";

import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectControlPanel,
  setUseSharpChords,
} from "../../../store/controlPanelSlice";
import { CheckBox } from "./CheckBox";

export const UseSharpChordsCheckbox: React.FC = (props) => {
  const { useSharpChords } = useSelector(selectControlPanel);
  const dispatch = useDispatch();

  return (
    <CheckBox
      {...props}
      label="Show chords for # notes"
      value={useSharpChords}
      onValueChange={(value: boolean) => dispatch(setUseSharpChords(value))}
    />
  );
};
