"use client";

import { selectUi, setUseAdvancedChords } from "@/app/store/uiSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { CheckBox } from "../../uiFramework/CheckBox";

export const UseAdvancedChordsCheckbox: React.FC = (props) => {
  const { useAdvancedChords } = useSelector(selectUi);
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
