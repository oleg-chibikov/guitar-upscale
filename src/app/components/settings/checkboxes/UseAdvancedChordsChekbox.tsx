"useClient";

import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectControlPanel,
  setUseAdvancedChords,
} from "../../../store/controlPanelSlice";
import { CheckBox } from "./CheckBox";

export const UseAdvancedChordsCheckbox: React.FC = (props) => {
  const { useAdvancedChords } = useSelector(selectControlPanel);
  const dispatch = useDispatch();

  return (
    <CheckBox
      {...props}
      label="Show advanced chords"
      value={useAdvancedChords}
      onValueChange={(value: boolean) => dispatch(setUseAdvancedChords(value))}
    />
  );
};
