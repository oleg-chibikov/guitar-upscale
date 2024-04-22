"use client";

import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectSettings,
  setUseAdvancedChords,
} from "../../../store/settingsSlice";
import { CheckBox } from "./CheckBox";

export const UseAdvancedChordsCheckbox: React.FC = (props) => {
  const { useAdvancedChords } = useSelector(selectSettings);
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
