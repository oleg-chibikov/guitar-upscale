import SettingsApplications from "@mui/icons-material/SettingsApplications";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectControlPanel,
  setSettingsExpanded,
} from "../../../store/controlPanelSlice";
import { IconButton } from "./IconButton";

export const OpenSettingsButton: React.FC = (props) => {
  const dispatch = useDispatch();
  const { settingsExpanded } = useSelector(selectControlPanel);
  return (
    <IconButton
      {...props}
      icon={<SettingsApplications />}
      tooltip={
        settingsExpanded ? "Close settings panel" : "Open settings panel"
      }
      isActive={settingsExpanded}
      onPress={() => dispatch(setSettingsExpanded(!settingsExpanded))}
    />
  );
};
