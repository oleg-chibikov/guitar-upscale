"use client";

import {
  refreshSettings,
  selectSettings,
  setChordDetectorFunctions,
  setChordIsBeingDetected,
} from "@/app/store/settingsSlice";
import SearchOff from "@mui/icons-material/SearchOff";
import Troubleshoot from "@mui/icons-material/Troubleshoot";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IconButton } from "./IconButton";

const setDetectorInSettings = async () => {
  const { createChordDetectorLookup, addChordToDetectorLookup } = await import(
    "@/app/engine/chordDetector"
  );
  setChordDetectorFunctions(
    addChordToDetectorLookup,
    createChordDetectorLookup
  );
};

export const DetectChordButton: React.FC = (props) => {
  const dispatch = useDispatch();
  const { chordIsBeingDetected } = useSelector(selectSettings);
  useEffect(() => {
    // async load detector module and set its functions to settings.
    setDetectorInSettings();
    dispatch(refreshSettings());
  }, [dispatch]);
  return (
    <IconButton
      {...props}
      icon={chordIsBeingDetected ? <SearchOff /> : <Troubleshoot />}
      tooltip={chordIsBeingDetected ? "Stop detecting chord" : "Detect chord"}
      isActive={chordIsBeingDetected}
      activeBg="bg-red-500"
      onPress={async () => {
        const { clearDetector } = await import("@/app/engine/chordDetector");
        if (chordIsBeingDetected) {
          clearDetector();
        }
        dispatch(setChordIsBeingDetected(!chordIsBeingDetected));
      }}
    />
  );
};
