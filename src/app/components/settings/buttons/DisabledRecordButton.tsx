"use client";
import { AlertType } from "@/app/data/alertType";
import { setAndShowAlert } from "@/app/store/uiSlice";
import FiberManualRecord from "@mui/icons-material/FiberManualRecord";
import React from "react";
import { useDispatch } from "react-redux";
import { IconButton } from "./IconButton";

const noPremiumWarning = "Please subscribe to a Composer plan to record MIDI";
export const DisabledRecordButton: React.FC = (props) => {
  const dispatch = useDispatch();
  return (
    <IconButton
      {...props}
      icon={<FiberManualRecord />}
      disabled
      allowHandlerInDisabledState
      tooltip={noPremiumWarning}
      onPress={() =>
        dispatch(
          setAndShowAlert({
            message: noPremiumWarning,
            alertType: AlertType.Warning,
          })
        )
      }
    />
  );
};
