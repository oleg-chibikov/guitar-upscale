"use client";

import { clearDetector } from "@/app/engine/chordDetector";
import {
  selectSettings,
  setChordIsBeingDetected,
} from "@/app/store/settingsSlice";
import SearchOff from "@mui/icons-material/SearchOff";
import Troubleshoot from "@mui/icons-material/Troubleshoot";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { IconButton } from "./IconButton";

export const DetectChordButton: React.FC = (props) => {
  const dispatch = useDispatch();
  const { chordIsBeingDetected } = useSelector(selectSettings);
  return (
    <IconButton
      {...props}
      icon={chordIsBeingDetected ? <SearchOff /> : <Troubleshoot />}
      tooltip={chordIsBeingDetected ? "Stop detecting chord" : "Detect chord"}
      isActive={chordIsBeingDetected}
      activeBg="bg-red-500"
      onPress={() => {
        if (chordIsBeingDetected) {
          clearDetector();
        }
        dispatch(setChordIsBeingDetected(!chordIsBeingDetected));
      }}
    />
  );
};
