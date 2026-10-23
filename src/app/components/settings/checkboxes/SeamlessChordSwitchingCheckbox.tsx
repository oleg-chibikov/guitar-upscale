import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { setSeamlessChordSwitching } from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch } from "react-redux";
import { CheckBox } from "../../uiFramework/CheckBox";

export const SeamlessChordSwitchingCheckbox: React.FC = (props) => {
  const seamlessChordSwitching = useSettingsSelector(
    (s) => s.seamlessChordSwitching,
  );
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
