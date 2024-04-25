import { selectUi, setStrummingSettingsExpanded } from "@/app/store/uiSlice";
import Tune from "@mui/icons-material/Tune";
import React from "react";
import ReactGA from "react-ga4";
import { useDispatch, useSelector } from "react-redux";
import { IconButton } from "./IconButton";

export const OpenStrummingSettingsButton: React.FC = (props) => {
  const dispatch = useDispatch();
  const { strummingSettingsExpanded } = useSelector(selectUi);
  return (
    <IconButton
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
