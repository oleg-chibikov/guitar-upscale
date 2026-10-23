import { useUiSelector } from "@/app/hooks/storeHooks";
import { setStrummingSettingsExpanded } from "@/app/store/uiSlice";
import Tune from "@mui/icons-material/Tune";
import React from "react";
import ReactGA from "react-ga4";
import { useDispatch } from "react-redux";
import { IconButtonWrapper } from "../../uiFramework/IconButton";

export const OpenStrummingSettingsButton: React.FC = (props) => {
  const dispatch = useDispatch();
  const strummingSettingsExpanded = useUiSelector(
    (s) => s.strummingSettingsExpanded,
  );
  return (
    <IconButtonWrapper
      {...props}
      icon={<Tune />}
      tooltip={
        strummingSettingsExpanded
          ? "Close strumming settings panel"
          : "Open strumming settings panel"
      }
      isActive={strummingSettingsExpanded}
      onPress={() => {
        dispatch(setStrummingSettingsExpanded(!strummingSettingsExpanded));
        ReactGA.event({
          category: "Settings",
          action: "Open strumming settings",
        });
      }}
    />
  );
};
