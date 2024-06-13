"use client";

import { AlertType } from "@/app/data/alertType";
import { MIN_NOTES_TO_DETECT_SCALE } from "@/app/engine/scales/scaleDetector";
import { useScaleDetectorSetup } from "@/app/hooks/useScaleDetectorSetup";
import {
  selectSettings,
  setScale,
  setScaleGroup,
  setScaleIsBeingDetected,
} from "@/app/store/settingsSlice";
import { setAndShowAlert } from "@/app/store/uiSlice";
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
          dispatch(setScaleGroup("Special"));
          dispatch(setScale("Chromatic (All notes)"));
          dispatch(
            setAndShowAlert({
              message:
                "Chromatic scale has been selected. Please tap on at least " +
                MIN_NOTES_TO_DETECT_SCALE +
                " different notes to detect the scale",
              alertType: AlertType.Neutral,
              alertTimeout: 5000,
            })
          );
        }
        dispatch(setScaleIsBeingDetected(!scaleIsBeingDetected));
      }}
    />
  );
};
