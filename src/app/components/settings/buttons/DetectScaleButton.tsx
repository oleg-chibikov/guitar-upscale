"use client";

import { useScaleDetectorSetup } from "@/app/hooks/useScaleDetectorSetup";
import {
  selectSettings,
  setChordIsBeingDetected,
  setScaleIsBeingDetected,
} from "@/app/store/settingsSlice";
import ManageSearch from "@mui/icons-material/ManageSearch";
import SearchOff from "@mui/icons-material/SearchOff";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { IconButton } from "./IconButton";

export const DetectScaleButton: React.FC = (props) => {
  const dispatch = useDispatch();
  const { scaleIsBeingDetected } = useSelector(selectSettings);
  const setupScaleDetector = useScaleDetectorSetup();
  return (
    <IconButton
      {...props}
      icon={scaleIsBeingDetected ? <SearchOff /> : <ManageSearch />}
      tooltip={scaleIsBeingDetected ? "Stop detecting scale" : "Detect scale"}
      isActive={scaleIsBeingDetected}
      activeBg="bg-red-500"
      onPress={async () => {
        if (!scaleIsBeingDetected) {
          await setupScaleDetector();
          dispatch(setChordIsBeingDetected(false));
        }
        dispatch(setScaleIsBeingDetected(!scaleIsBeingDetected));
      }}
    />
  );
};
