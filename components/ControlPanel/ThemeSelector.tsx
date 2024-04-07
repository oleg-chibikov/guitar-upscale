import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Theme,
  selectControlPanel,
  setTheme,
} from "../../store/controlPanelSlice";
import { EnumSelector } from "./EnumSelector";

export const ThemeSelector: React.FC = () => {
  const { theme } = useSelector(selectControlPanel);
  const dispatch = useDispatch();

  return (
    <EnumSelector
      enumObj={Theme}
      selectedValue={theme}
      onValueChange={(value) => {
        dispatch(setTheme(value));
      }}
    />
  );
};
