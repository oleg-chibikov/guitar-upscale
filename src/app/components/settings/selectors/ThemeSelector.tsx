import { Theme } from "@/app/data/theme";
import { selectUi, setTheme } from "@/app/store/uiSlice";
import { Typography } from "@mui/material";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { EnumSelector } from "./EnumSelector";

const convertOSTheme = (theme: Theme) => {
  let tempTheme = theme;
  if (tempTheme === Theme.MatchOS) {
    tempTheme = window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? Theme.Dark
      : Theme.Light;
  }
  return tempTheme;
};

export const ThemeSelector: React.FC = () => {
  const { theme } = useSelector(selectUi);
  const dispatch = useDispatch();

  return (
    <>
      <Typography variant="body2">Theme:</Typography>
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
