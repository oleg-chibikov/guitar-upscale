"use client";
import { AlertType } from "@/app/data/alertType";
import { setAndShowAlert } from "@/app/store/uiSlice";
import Troubleshoot from "@mui/icons-material/Troubleshoot";
import React from "react";
import { useDispatch } from "react-redux";
import { IconButton } from "./IconButton";

const noPremiumWarning = "Please subscribe to any plan to detect chords";
export const DisabledDetectChordButton: React.FC = (props) => {
  const dispatch = useDispatch();
  return (
    <IconButton
      {...props}
      icon={<Troubleshoot />}
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
