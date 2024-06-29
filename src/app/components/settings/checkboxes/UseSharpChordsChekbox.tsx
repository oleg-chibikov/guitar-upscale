"useClient";

import { selectUi, setUseSharpChords } from "@/app/store/uiSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { CheckBox } from "../../uiFramework/CheckBox";

export const UseSharpChordsCheckbox: React.FC = (props) => {
  const { useSharpChords } = useSelector(selectUi);
  const dispatch = useDispatch();

  return (
    <CheckBox
      {...props}
      label="Show chords for ♯ notes"
      value={useSharpChords}
      onValueChange={(value: boolean) => dispatch(setUseSharpChords(value))}
    />
  );
};
