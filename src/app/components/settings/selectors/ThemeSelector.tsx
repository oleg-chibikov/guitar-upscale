import { ControlWithLabel } from "@/app/components/uiFramework/ControlWithLabel";
import { Theme } from "@/app/data/theme";
import { useUiSelector } from "@/app/hooks/storeHooks";
import { setTheme } from "@/app/store/uiSlice";
import React from "react";
import { useDispatch } from "react-redux";
import { EnumSelector } from "../../uiFramework/EnumSelector";

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
  const theme = useUiSelector((s) => s.theme);
  const dispatch = useDispatch();

  return (
    <ControlWithLabel label="Theme">
      <EnumSelector
        enumObj={Theme}
        selectedValue={theme}
        onValueChange={(value) => {
          dispatch(setTheme(convertOSTheme(value)));
        }}
      />
    </ControlWithLabel>
  );
};
