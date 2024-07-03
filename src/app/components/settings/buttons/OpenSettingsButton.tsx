import { useUiSelector } from "@/app/hooks/storeHooks";
import { setSettingsExpanded } from "@/app/store/uiSlice";
import SettingsApplications from "@mui/icons-material/SettingsApplications";
import React from "react";
import ReactGA from "react-ga4";
import { useDispatch } from "react-redux";
import { IconButtonWrapper } from "../../uiFramework/IconButton";

export const OpenSettingsButton: React.FC = (props) => {
  const dispatch = useDispatch();
  const settingsExpanded = useUiSelector((s) => s.settingsExpanded);
  return (
    <IconButtonWrapper
      {...props}
      icon={<SettingsApplications />}
      tooltip={
        settingsExpanded ? "Close settings panel" : "Open settings panel"
      }
      isActive={settingsExpanded}
      onPress={() => {
        dispatch(setSettingsExpanded(!settingsExpanded));
        ReactGA.event({
          category: "Settings",
          action: "Open settings",
        });
      }}
    />
  );
};
