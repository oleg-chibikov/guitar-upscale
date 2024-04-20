import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Theme,
  selectControlPanel,
  setTheme,
} from "../../../store/controlPanelSlice";
import { EnumSelector } from "./EnumSelector";

const convertOSTheme = (theme: Theme) => {
  let tempTheme = theme;
  if (tempTheme === Theme.MatchOS) {
    tempTheme =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? Theme.Dark
        : Theme.Light;
  }
  return tempTheme;
};

export const ThemeSelector: React.FC = () => {
  const { theme } = useSelector(selectControlPanel);
  const dispatch = useDispatch();

  return (
    <>
      <span>Theme:</span>
      <EnumSelector
        enumObj={Theme}
        selectedValue={theme}
        onValueChange={(value) => {
          dispatch(setTheme(convertOSTheme(value)));
        }}
      />
    </>
  );
};
