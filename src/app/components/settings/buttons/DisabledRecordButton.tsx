"use client";
import FiberManualRecord from "@mui/icons-material/FiberManualRecord";
import React from "react";
import { useSelector } from "react-redux";
import { Theme, selectControlPanel } from "../../../store/controlPanelSlice";
import { IconButton } from "./IconButton";

const noPremiumWarning = "Please subscribe to a Composer plan to record MIDI";
export const DisabledRecordButton: React.FC = (props) => {
  const { theme } = useSelector(selectControlPanel);
  return (
    <IconButton
      {...props}
      icon={<FiberManualRecord />}
      inactiveBg={
        theme === Theme.Light ? "bg-disabled-light" : "bg-disabled-dark"
      }
      tooltip={noPremiumWarning}
      onPress={() => alert(noPremiumWarning)}
    />
  );
};
