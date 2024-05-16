"use client";
import { AlertType } from "@/app/data/alertType";
import { Theme } from "@/app/data/theme";
import { selectUi, setAndShowAlert } from "@/app/store/uiSlice";
import Troubleshoot from "@mui/icons-material/Troubleshoot";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { IconButton } from "./IconButton";

const noPremiumWarning = "Please subscribe to any plan to detect chords";
export const DisabledDetectChordButton: React.FC = (props) => {
  const { theme } = useSelector(selectUi);
  const dispatch = useDispatch();
  return (
    <IconButton
      {...props}
      icon={<Troubleshoot />}
      inactiveBg={
        theme === Theme.Light ? "bg-disabled-light" : "bg-disabled-dark"
      }
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
