"useClient";

import { useUiSelector } from "@/app/hooks/storeHooks";
import { setUseSharpChords } from "@/app/store/uiSlice";
import React from "react";
import { useDispatch } from "react-redux";
import { CheckBox } from "../../uiFramework/CheckBox";

export const UseSharpChordsCheckbox: React.FC = (props) => {
  const useSharpChords = useUiSelector((s) => s.useSharpChords);
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
