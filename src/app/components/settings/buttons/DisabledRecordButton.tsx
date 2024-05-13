"use client";
import { Theme } from "@/app/data/theme";
import { selectUi, setAndShowAlert } from "@/app/store/uiSlice";
import FiberManualRecord from "@mui/icons-material/FiberManualRecord";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { IconButton } from "./IconButton";

const noPremiumWarning = "Please subscribe to a Composer plan to record MIDI";
export const DisabledRecordButton: React.FC = (props) => {
  const { theme } = useSelector(selectUi);
  const dispatch = useDispatch();
  return (
    <IconButton
      {...props}
      icon={<FiberManualRecord />}
      inactiveBg={
        theme === Theme.Light ? "bg-disabled-light" : "bg-disabled-dark"
      }
      tooltip={noPremiumWarning}
      onPress={() =>
        dispatch(setAndShowAlert({ message: noPremiumWarning, isError: true }))
      }
    />
  );
};
