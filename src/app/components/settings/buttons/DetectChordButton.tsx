"use client";

import {
  refreshSettings,
  selectSettings,
  setChordDetectorFunctions,
  setChordIsBeingDetected,
} from "@/app/store/settingsSlice";
import SearchOff from "@mui/icons-material/SearchOff";
import Troubleshoot from "@mui/icons-material/Troubleshoot";
import React, { useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IconButton } from "./IconButton";

export const DetectChordButton: React.FC = (props) => {
  const dispatch = useDispatch();
  const { chordIsBeingDetected } = useSelector(selectSettings);
  const settingsSet = useRef<boolean>(false);
  return (
    <IconButton
      {...props}
      icon={chordIsBeingDetected ? <SearchOff /> : <Troubleshoot />}
      tooltip={chordIsBeingDetected ? "Stop detecting chord" : "Detect chord"}
      isActive={chordIsBeingDetected}
      activeBg="bg-red-500"
      onPress={async () => {
        if (chordIsBeingDetected) {
          const { clearDetector } = await import("@/app/engine/chordDetector");
          clearDetector();
        } else {
          if (!settingsSet.current) {
            // async load detector module and set its functions to settings on the first detect action.
            const { createChordDetectorLookup, addChordToDetectorLookup } =
              await import("@/app/engine/chordDetector");
            setChordDetectorFunctions(
              addChordToDetectorLookup,
              createChordDetectorLookup
            );
            dispatch(refreshSettings());
          }
          settingsSet.current = true;
        }
        dispatch(setChordIsBeingDetected(!chordIsBeingDetected));
      }}
    />
  );
};
