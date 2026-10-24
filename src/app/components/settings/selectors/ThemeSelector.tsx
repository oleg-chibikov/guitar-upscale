import { ControlWithLabel } from "@/app/components/uiFramework/ControlWithLabel";
import { Theme } from "@/app/data/theme";
import { useUiSelector } from "@/app/hooks/storeHooks";
import { setFollowOs, setTheme } from "@/app/store/uiSlice";
import React from "react";
import { useDispatch } from "react-redux";
import { EnumSelector } from "../../uiFramework/EnumSelector";

export const ThemeSelector: React.FC = () => {
  const theme = useUiSelector((s) => s.theme);
  const followOs = useUiSelector((s) => s.followOs);
  const dispatch = useDispatch();

  return (
    <ControlWithLabel label="Theme">
      <EnumSelector
        enumObj={Theme}
        selectedValue={followOs ? Theme.MatchOS : theme}
        customLabel={(key, value) =>
          value === Theme.MatchOS ? "Match system" : key
        }
        onValueChange={(value) => {
          // ClientRoot sets the light or dark theme while it follows the OS
          dispatch(setFollowOs(value === Theme.MatchOS));
          if (value !== Theme.MatchOS) {
            dispatch(setTheme(value));
          }
        }}
      />
    </ControlWithLabel>
  );
};
