import { selectUi, setSettingsExpanded } from "@/app/store/uiSlice";
import SettingsApplications from "@mui/icons-material/SettingsApplications";
import React from "react";
import ReactGA from "react-ga4";
import { useDispatch, useSelector } from "react-redux";
import { IconButton } from "./IconButton";

export const OpenSettingsButton: React.FC = (props) => {
  const dispatch = useDispatch();
  const { settingsExpanded } = useSelector(selectUi);
  return (
    <IconButton
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
