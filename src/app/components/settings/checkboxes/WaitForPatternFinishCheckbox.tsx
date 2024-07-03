import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { setWaitForPatternFinish } from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch } from "react-redux";
import { CheckBox } from "../../uiFramework/CheckBox";

export const WaitForPatternFinishCheckbox: React.FC = (props) => {
  const waitForPatternFinish = useSettingsSelector(
    (s) => s.waitForPatternFinish
  );
  const dispatch = useDispatch();

  return (
    <CheckBox
      {...props}
      label="Wait for pattern to finish"
      value={waitForPatternFinish}
      onValueChange={(value: boolean) =>
        dispatch(setWaitForPatternFinish(value))
      }
    />
  );
};
