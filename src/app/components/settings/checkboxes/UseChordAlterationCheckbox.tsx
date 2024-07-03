import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { setUseChordAlteration } from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch } from "react-redux";
import { CheckBox } from "../../uiFramework/CheckBox";

export const UseChordAlterationCheckbox: React.FC = (props) => {
  const useChordAlteration = useSettingsSelector((s) => s.useChordAlteration);
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
