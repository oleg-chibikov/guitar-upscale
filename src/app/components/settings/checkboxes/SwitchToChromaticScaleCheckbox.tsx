import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectSettings,
  setSwitchToChromaticScale,
} from "../../../store/settingsSlice";
import { CheckBox } from "./CheckBox";

export const SwitchToChromaticScaleCheckbox: React.FC = (props) => {
  const { switchToChromaticScale } = useSelector(selectSettings);
  const dispatch = useDispatch();

  return (
    <CheckBox
      {...props}
      label="Switch to chromatic scale when opening chords"
      value={switchToChromaticScale}
      onValueChange={(value: boolean) =>
        dispatch(setSwitchToChromaticScale(value))
      }
    />
  );
};
