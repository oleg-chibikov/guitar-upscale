"use client";

import { useChordDetectorSetup } from "@/app/hooks/useChordDetectorSetup";
import {
  selectSettings,
  setChordIsBeingDetected,
  setScaleIsBeingDetected,
} from "@/app/store/settingsSlice";
import SearchOff from "@mui/icons-material/SearchOff";
import Troubleshoot from "@mui/icons-material/Troubleshoot";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { IconButton } from "./IconButton";

export const DetectChordButton: React.FC = (props) => {
  const dispatch = useDispatch();
  const { chordIsBeingDetected } = useSelector(selectSettings);
  const setupChordDetector = useChordDetectorSetup();
  return (
    <IconButton
      {...props}
      icon={chordIsBeingDetected ? <SearchOff /> : <Troubleshoot />}
      tooltip={chordIsBeingDetected ? "Stop detecting chord" : "Detect chord"}
      isActive={chordIsBeingDetected}
      activeBg="bg-red-500"
      onPress={async () => {
        if (!chordIsBeingDetected) {
          await setupChordDetector();
          dispatch(setScaleIsBeingDetected(false));
        }
        dispatch(setChordIsBeingDetected(!chordIsBeingDetected));
      }}
    />
  );
};
