"use client";

import { AlertType } from "@/app/data/alertType";
import { CHROMATIC, SPECIAL } from "@/app/data/scales";
import { MIN_NOTES_TO_DETECT_SCALE } from "@/app/engine/scales/scaleDetector";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { useScaleDetectorSetup } from "@/app/hooks/useScaleDetectorSetup";
import {
  setChordIsBeingDetected,
  setScale,
  setScaleGroup,
  setScaleIsBeingDetected,
} from "@/app/store/settingsSlice";
import { setAndShowAlert } from "@/app/store/uiSlice";
import ManageSearch from "@mui/icons-material/ManageSearch";
import SearchOff from "@mui/icons-material/SearchOff";
import React from "react";
import { useDispatch } from "react-redux";
import { IconButtonWrapper } from "../../uiFramework/IconButton";

export const DetectScaleButton: React.FC = (props) => {
  const dispatch = useDispatch();
  const scaleIsBeingDetected = useSettingsSelector(
    (s) => s.scaleIsBeingDetected
  );
  const setupScaleDetector = useScaleDetectorSetup();
  return (
    <IconButtonWrapper
      {...props}
      icon={scaleIsBeingDetected ? <SearchOff /> : <ManageSearch />}
      tooltip={scaleIsBeingDetected ? "Stop detecting scale" : "Detect scale"}
      isActive={scaleIsBeingDetected}
      activeBg="error"
      onPress={async () => {
        if (!scaleIsBeingDetected) {
          await setupScaleDetector();
          // Only one thing can be detected at a time - either chord or scale
          dispatch(setChordIsBeingDetected(false));
          dispatch(setScaleGroup(SPECIAL));
          dispatch(setScale(CHROMATIC));
          dispatch(
            setAndShowAlert({
              message:
                "Chromatic scale has been selected. Please tap on at least " +
                MIN_NOTES_TO_DETECT_SCALE +
                " different notes to detect a scale",
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
